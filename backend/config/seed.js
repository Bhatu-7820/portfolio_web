const Lead = require('../models/Lead');
const EmailTemplate = require('../models/EmailTemplate');
const Campaign = require('../models/Campaign');
const UploadedFile = require('../models/UploadedFile');
const fs = require('fs');
const path = require('path');

/**
 * Seed initial sample leads, templates, and sample catalog for new user accounts
 */
const seedUserData = async (userId) => {
  try {
    const existingLeadsCount = await Lead.countDocuments({ user: userId });
    if (existingLeadsCount > 0) {
      return; // Already has data
    }

    console.log(`[Seed] Initializing sample leads & templates for user ${userId}...`);

    // 1. Seed Sample Leads
    const sampleLeads = [
      {
        owner: 'John Miller',
        email: 'john.miller@abccorp.com',
        phone: '+1-987-654-3210',
        company: 'ABC Wholesale Corp',
        country: 'USA',
        type: 'Business',
        source: 'CSV Import',
        score: 95,
        user: userId
      },
      {
        owner: 'David Sterling',
        email: 'david.sterling@xyzltd.co.uk',
        phone: '+44-20-7946-0922',
        company: 'XYZ Trading Ltd',
        country: 'UK',
        type: 'Business',
        source: 'Lead Discovery',
        score: 88,
        user: userId
      },
      {
        owner: 'Sarah Jenkins',
        email: 'sarah.jenkins@zenithwholesalers.com',
        phone: '+1-555-0192',
        company: 'Zenith Crafts & Wholesale',
        country: 'USA',
        type: 'Business',
        source: 'Lead Discovery',
        score: 92,
        user: userId
      },
      {
        owner: 'Alice Morgan',
        email: 'alice.morgan@gmail.com',
        phone: '+1-555-0144',
        company: 'Individual Buyer',
        country: 'USA',
        type: 'Individual',
        source: 'Manual',
        score: 75,
        user: userId
      },
      {
        owner: 'Girase Bhatu Test',
        email: 'girasebhatu70@gmail.com',
        phone: '+91-9876543210',
        company: 'Girase Enterprises',
        country: 'India',
        type: 'Business',
        source: 'Manual',
        score: 99,
        user: userId
      }
    ];

    const createdLeads = await Lead.insertMany(sampleLeads);

    // 2. Seed Sample Templates
    const sampleTemplate = await EmailTemplate.create({
      name: 'Product Introduction & Wholesale Catalog',
      subject: 'Handcrafted Wholesale Products Partnership for {{businessName}}',
      htmlContent: `<p>Hello {{ownerName}},</p>\n\n<p>We are pleased to introduce our handcrafted product collection to {{businessName}}.</p>\n\n<p>Please find our complete catalog attached. We would love to discuss custom wholesale rates for {{country}}.</p>\n\n<p>Best regards,<br>Sales Director<br>WhatsApp: {{phone}}</p>\n\n<p><a href="{{unsubscribeUrl}}">Unsubscribe from future updates</a></p>`,
      user: userId
    });

    // 3. Create a Dummy PDF Catalog if none exists
    const catalogDir = path.join(__dirname, '../uploads/catalogs');
    if (!fs.existsSync(catalogDir)) {
      fs.mkdirSync(catalogDir, { recursive: true });
    }
    const samplePdfPath = path.join(catalogDir, 'product-catalog-2026.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      fs.writeFileSync(samplePdfPath, '%PDF-1.4 ... Sample EmailPro Product Catalog Attachment ...');
    }

    const sampleCatalog = await UploadedFile.create({
      filename: 'product-catalog-2026.pdf',
      originalName: 'handcrafted-singing-bowl-catalog.pdf',
      path: samplePdfPath,
      mimeType: 'application/pdf',
      size: 1024 * 250,
      uploadedBy: userId
    });

    // 4. Seed Sample Campaign
    await Campaign.create({
      name: 'Q3 B2B Wholesale Outreach Campaign',
      subject: 'Handcrafted Wholesale Products Partnership for {{businessName}}',
      template: sampleTemplate._id,
      targetAudience: 'Business',
      attachment: sampleCatalog._id,
      recipientCount: 4,
      sentCount: 0,
      failedCount: 0,
      status: 'Draft',
      user: userId
    });

    console.log(`[Seed] Successfully seeded sample data for user!`);
  } catch (err) {
    console.error(`[Seed] Failed to seed user data:`, err.message);
  }
};

module.exports = { seedUserData };
