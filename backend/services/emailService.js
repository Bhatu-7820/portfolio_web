const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');
const Campaign = require('../models/Campaign');

/**
 * Creates Nodemailer Transporter based on User SMTP settings, environment variables, or Ethereal/Dev Fallback
 */
const getTransporter = async (user) => {
  let host = user?.smtpConfig?.smtpHost || process.env.SMTP_HOST;
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
    await lead.save();
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
 * Send Individual Email to single recipient (by leadId or direct custom email)
 */
const sendIndividualEmail = async ({ userId, user, leadId, customEmail, customName, subject, htmlContent, attachmentFile }) => {
  let lead = null;
  let targetEmail = customEmail;
  let targetOwner = customName || 'Valued Client';

  if (leadId) {
    lead = await Lead.findOne({ _id: leadId, user: userId });
    if (lead) {
      targetEmail = lead.email;
      targetOwner = lead.owner;
    }
  }

  // Fallback: If no leadId supplied, find or create Lead by customEmail
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

  if (!lead && !targetEmail) {
    throw new Error('Please select a recipient lead or provide a valid recipient email address.');
  }

  if (lead && lead.unsubscribed) {
    throw new Error(`Lead (${lead.email}) has unsubscribed. Delivery blocked.`);
  }

  const unsubscribeUrl = await getOrCreateUnsubscribeUrl(lead);
  const personalizedSubject = interpolateTemplate(subject, lead, unsubscribeUrl);
  const personalizedHtml = interpolateTemplate(htmlContent, lead, unsubscribeUrl);

  // Create EmailLog in 'pending' status
  const emailLog = await EmailLog.create({
    lead: lead ? lead._id : null,
    recipientEmail: targetEmail || lead.email,
    subject: personalizedSubject,
    status: 'pending',
    user: userId
  });

  try {
    const transporter = await getTransporter(user);
    const senderName = user?.smtpConfig?.senderName || process.env.SENDER_NAME || 'Girase Bhatu (EmailPro)';
    const senderEmail = user?.smtpConfig?.senderEmail || process.env.SENDER_EMAIL || 'girasebhatu70@gmail.com';

    let messageId = `sim-${Date.now()}`;
    let previewUrl = null;

    if (transporter) {
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: targetEmail || lead.email,
        subject: personalizedSubject,
        html: personalizedHtml
      };

      if (attachmentFile && attachmentFile.path) {
        mailOptions.attachments = [
          {
            filename: attachmentFile.originalName || attachmentFile.filename,
            path: attachmentFile.path
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId;
      previewUrl = nodemailer.getTestMessageUrl(info);
    } else {
      console.log(`[EmailService] [Simulator Mode] Email dispatched to ${targetEmail || lead.email}`);
    }

    // Update log & lead status
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    await emailLog.save();

    if (lead) {
      lead.contacted = true;
      await lead.save();
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
    emailLog.status = 'failed';
    emailLog.errorMessage = cleanMessage;
    await emailLog.save();

    throw new Error(cleanMessage);
  }
};

/**
 * Send Bulk Campaign Email to multiple leads with async rate limiting and per-recipient tracking
 */
const sendBulkCampaignEmail = async ({ userId, user, campaignId, leadIds, subject, htmlContent, attachmentFile }) => {
  const leads = await Lead.find({ _id: { $in: leadIds }, user: userId });
  if (!leads.length) {
    throw new Error('No valid lead records selected for bulk sending');
  }

  let campaign = null;
  if (campaignId) {
    campaign = await Campaign.findOne({ _id: campaignId, user: userId });
  }

  if (campaign) {
    campaign.status = 'Sending';
    campaign.recipientCount = leads.length;
    await campaign.save();
  }

  const transporter = await getTransporter(user);
  const senderName = user?.smtpConfig?.senderName || process.env.SENDER_NAME || 'Girase Bhatu (EmailPro)';
  const senderEmail = user?.smtpConfig?.senderEmail || process.env.SENDER_EMAIL || 'girasebhatu70@gmail.com';

  let sentCount = 0;
  let failedCount = 0;
  const results = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (lead.unsubscribed) {
      console.log(`[EmailService] Skipping unsubscribed lead: ${lead.email}`);
      await EmailLog.create({
        campaign: campaign ? campaign._id : null,
        lead: lead._id,
        recipientEmail: lead.email,
        subject,
        status: 'failed',
        errorMessage: 'Recipient has unsubscribed',
        user: userId
      });
      failedCount++;
      if (campaign) {
        campaign.failedCount = failedCount;
        await campaign.save();
      }
      continue;
    }

    const unsubscribeUrl = await getOrCreateUnsubscribeUrl(lead);
    const personalizedSubject = interpolateTemplate(subject, lead, unsubscribeUrl);
    const personalizedHtml = interpolateTemplate(htmlContent, lead, unsubscribeUrl);

    const emailLog = await EmailLog.create({
      campaign: campaign ? campaign._id : null,
      lead: lead._id,
      recipientEmail: lead.email,
      subject: personalizedSubject,
      status: 'pending',
      user: userId
    });

    try {
      let previewUrl = null;
      if (transporter) {
        const mailOptions = {
          from: `"${senderName}" <${senderEmail}>`,
          to: lead.email,
          subject: personalizedSubject,
          html: personalizedHtml
        };

        if (attachmentFile && attachmentFile.path) {
          mailOptions.attachments = [
            {
              filename: attachmentFile.originalName || attachmentFile.filename,
              path: attachmentFile.path
            }
          ];
        }

        const info = await transporter.sendMail(mailOptions);
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();

      lead.contacted = true;
      await lead.save();

      sentCount++;
      results.push({ email: lead.email, status: 'sent', logId: emailLog._id, previewUrl: previewUrl || null });
    } catch (err) {
      let cleanMessage = err.message;
      if (err.message.includes('EAUTH') || err.message.includes('Invalid login')) {
        cleanMessage = 'Gmail Auth Failed: Enter 16-character App Password in Settings.';
      }

      console.error(`[EmailService] Bulk item failed for ${lead.email}:`, cleanMessage);
      emailLog.status = 'failed';
      emailLog.errorMessage = cleanMessage;
      await emailLog.save();

      failedCount++;
      results.push({ email: lead.email, status: 'failed', error: cleanMessage });
    }

    if (campaign) {
      campaign.sentCount = sentCount;
      campaign.failedCount = failedCount;
      await campaign.save();
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (campaign) {
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
