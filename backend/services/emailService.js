const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');
const Campaign = require('../models/Campaign');
const memoryStore = require('../config/memoryStore');

/**
 * Creates Nodemailer Transporter based on User SMTP settings, environment variables, or Ethereal/Dev Fallback
 */
const getTransporter = async (user) => {
  let host = user?.smtpConfig?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  let port = user?.smtpConfig?.smtpPort || process.env.SMTP_PORT || 587;
  let userEmail = user?.smtpConfig?.smtpUser || process.env.SMTP_USER || 'girasebhatu70@gmail.com';
  let pass = user?.smtpConfig?.smtpPassword || process.env.SMTP_PASSWORD;

  // If real host and password are configured, use real SMTP (Gmail, SendGrid, Mailtrap, etc.)
  if (host && userEmail && pass) {
    const isGmail = host.includes('gmail');
    console.log(`[EmailService] Using Real ${isGmail ? 'Gmail' : 'SMTP'} Transporter (${userEmail})`);

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: userEmail,
          pass
        }
      });
    }

    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user: userEmail, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  // Safe Development Fallback via Ethereal Email or Local Simulator
  try {
    console.log('[EmailService] SMTP Password empty/not set. Initializing Ethereal Test Account...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn('[EmailService] Ethereal connection unavailable. Using Local Simulator Mode.');
    return null;
  }
};

/**
 * Generates dynamic unsubscribe token if missing and builds public unsubscribe URL
 */
const getOrCreateUnsubscribeUrl = async (lead) => {
  if (!lead) return 'http://localhost:5173/unsubscribe/demo';
  if (!lead.unsubscribeToken) {
    lead.unsubscribeToken = crypto.randomBytes(24).toString('hex');
    if (mongoose.connection.readyState === 1 && typeof lead.save === 'function') {
      await lead.save();
    }
  }
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/unsubscribe/${lead.unsubscribeToken}`;
};

/**
 * Interpolates dynamic parameters inside template content
 */
const interpolateTemplate = (content, lead, unsubscribeUrl) => {
  if (!content) return '';
  const owner = lead?.owner || 'Valued Client';
  const company = lead?.company || 'your business';
  const email = lead?.email || '';
  const phone = lead?.phone || 'N/A';
  const country = lead?.country || 'Global';

  return content
    .replace(/\{\{ownerName\}\}/g, owner)
    .replace(/\{\{businessName\}\}/g, company)
    .replace(/\{\{email\}\}/g, email)
    .replace(/\{\{phone\}\}/g, phone)
    .replace(/\{\{country\}\}/g, country)
    .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
};

/**
 * Get default catalog PDF attachment if available
 */
const getDefaultCatalogAttachment = () => {
  const defaultPath = path.join(__dirname, '../uploads/catalogs/product-catalog-2026.pdf');
  if (fs.existsSync(defaultPath)) {
    return {
      originalName: 'Product-Wholesale-Catalog-2026.pdf',
      path: defaultPath
    };
  }
  return null;
};

/**
 * Send Individual Email to single recipient (by leadId or direct custom email)
 */
const sendIndividualEmail = async ({ userId, user, leadId, customEmail, customName, subject, htmlContent, attachmentFile }) => {
  let lead = null;
  let targetEmail = customEmail;
  let targetOwner = customName || 'Valued Client';

  if (mongoose.connection.readyState === 1) {
    if (leadId) {
      lead = await Lead.findOne({ _id: leadId, user: userId });
      if (lead) {
        targetEmail = lead.email;
        targetOwner = lead.owner;
      }
    }

    if (!lead && targetEmail) {
      const emailClean = targetEmail.toLowerCase().trim();
      lead = await Lead.findOne({ email: emailClean, user: userId });
      if (!lead) {
        lead = await Lead.create({
          owner: targetOwner,
          email: emailClean,
          source: 'Manual Direct Email',
          user: userId
        });
      }
    }
  } else {
    // Memory store path
    const leads = memoryStore.getLeadsByUser(userId);
    if (leadId) {
      lead = leads.find(l => l._id === leadId);
    }
    if (!lead && targetEmail) {
      lead = memoryStore.createLead({
        owner: targetOwner,
        email: targetEmail.toLowerCase().trim(),
        source: 'Manual Direct Email',
        user: userId
      });
    }
    if (lead) {
      targetEmail = lead.email;
      targetOwner = lead.owner;
    }
  }

  if (!lead && !targetEmail) {
    throw new Error('Please select a recipient lead or provide a valid recipient email address.');
  }

  if (lead && lead.unsubscribed) {
    throw new Error(`Lead (${lead.email}) has unsubscribed. Delivery blocked.`);
  }

  const unsubscribeUrl = await getOrCreateUnsubscribeUrl(lead);
  const personalizedSubject = interpolateTemplate(subject, lead, unsubscribeUrl);
  const personalizedHtml = interpolateTemplate(htmlContent, lead, unsubscribeUrl);

  const activeAttachment = attachmentFile || getDefaultCatalogAttachment();

  let emailLog = {
    _id: 'log_' + Date.now(),
    lead: lead ? lead._id : null,
    recipientEmail: targetEmail || lead.email,
    subject: personalizedSubject,
    status: 'pending',
    user: userId
  };

  if (mongoose.connection.readyState === 1) {
    emailLog = await EmailLog.create(emailLog);
  }

  try {
    const transporter = await getTransporter(user);
    const senderName = user?.smtpConfig?.senderName || process.env.SENDER_NAME || 'Girase Bhatu (EmailPro)';
    const senderEmail = user?.smtpConfig?.senderEmail || process.env.SENDER_EMAIL || 'girasebhatu70@gmail.com';

    let messageId = `msg-${Date.now()}`;
    let previewUrl = null;

    if (transporter) {
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: targetEmail || lead.email,
        subject: personalizedSubject,
        html: personalizedHtml
      };

      if (activeAttachment && activeAttachment.path) {
        mailOptions.attachments = [
          {
            filename: activeAttachment.originalName || activeAttachment.filename || 'Attachment.pdf',
            path: activeAttachment.path
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId || messageId;
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService] Email successfully sent to ${targetEmail || lead.email}! Message ID: ${messageId}`);
    } else {
      console.log(`[EmailService] [Simulated Delivery] Email sent to ${targetEmail || lead.email}`);
    }

    if (mongoose.connection.readyState === 1) {
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();
      if (lead) {
        lead.contacted = true;
        await lead.save();
      }
    } else {
      emailLog.status = 'sent';
      if (lead) lead.contacted = true;
    }

    return {
      success: true,
      log: emailLog,
      messageId,
      previewUrl: previewUrl || null
    };
  } catch (error) {
    let cleanMessage = error.message;
    if (error.message.includes('EAUTH') || error.message.includes('Invalid login')) {
      cleanMessage = 'Gmail Auth Failed: Enter 16-character App Password in Settings (from myaccount.google.com/apppasswords).';
    }

    console.error(`[EmailService] Delivery Failed:`, cleanMessage);
    if (mongoose.connection.readyState === 1 && typeof emailLog.save === 'function') {
      emailLog.status = 'failed';
      emailLog.errorMessage = cleanMessage;
      await emailLog.save();
    }

    throw new Error(cleanMessage);
  }
};

/**
 * Send Bulk Campaign Email to multiple leads with async rate limiting and per-recipient tracking
 */
const sendBulkCampaignEmail = async ({ userId, user, campaignId, leadIds, subject, htmlContent, attachmentFile }) => {
  let leads = [];
  if (mongoose.connection.readyState === 1) {
    leads = await Lead.find({ _id: { $in: leadIds }, user: userId });
  } else {
    const allLeads = memoryStore.getLeadsByUser(userId);
    leads = allLeads.filter(l => leadIds.includes(l._id));
  }

  if (!leads.length) {
    throw new Error('No valid lead records selected for bulk sending');
  }

  let campaign = null;
  if (mongoose.connection.readyState === 1 && campaignId) {
    campaign = await Campaign.findOne({ _id: campaignId, user: userId });
    if (campaign) {
      campaign.status = 'Sending';
      campaign.recipientCount = leads.length;
      await campaign.save();
    }
  }

  const transporter = await getTransporter(user);
  const senderName = user?.smtpConfig?.senderName || process.env.SENDER_NAME || 'Girase Bhatu (EmailPro)';
  const senderEmail = user?.smtpConfig?.senderEmail || process.env.SENDER_EMAIL || 'girasebhatu70@gmail.com';
  const activeAttachment = attachmentFile || getDefaultCatalogAttachment();

  let sentCount = 0;
  let failedCount = 0;
  const results = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (lead.unsubscribed) {
      failedCount++;
      continue;
    }

    const unsubscribeUrl = await getOrCreateUnsubscribeUrl(lead);
    const personalizedSubject = interpolateTemplate(subject, lead, unsubscribeUrl);
    const personalizedHtml = interpolateTemplate(htmlContent, lead, unsubscribeUrl);

    try {
      let previewUrl = null;
      if (transporter) {
        const mailOptions = {
          from: `"${senderName}" <${senderEmail}>`,
          to: lead.email,
          subject: personalizedSubject,
          html: personalizedHtml
        };

        if (activeAttachment && activeAttachment.path) {
          mailOptions.attachments = [
            {
              filename: activeAttachment.originalName || activeAttachment.filename || 'Attachment.pdf',
              path: activeAttachment.path
            }
          ];
        }

        const info = await transporter.sendMail(mailOptions);
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      lead.contacted = true;
      if (mongoose.connection.readyState === 1 && typeof lead.save === 'function') {
        await lead.save();
      }

      sentCount++;
      results.push({ email: lead.email, status: 'sent', previewUrl: previewUrl || null });
    } catch (err) {
      let cleanMessage = err.message;
      if (err.message.includes('EAUTH') || err.message.includes('Invalid login')) {
        cleanMessage = 'Gmail Auth Failed: Enter 16-character App Password in Settings.';
      }
      failedCount++;
      results.push({ email: lead.email, status: 'failed', error: cleanMessage });
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (mongoose.connection.readyState === 1 && campaign) {
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.status = failedCount === leads.length ? 'Failed' : 'Completed';
    await campaign.save();
  }

  return {
    totalRecipients: leads.length,
    sentCount,
    failedCount,
    results
  };
};

module.exports = {
  sendIndividualEmail,
  sendBulkCampaignEmail,
  interpolateTemplate,
  getOrCreateUnsubscribeUrl
};
