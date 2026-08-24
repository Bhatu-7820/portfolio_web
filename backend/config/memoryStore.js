const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storeFile = path.join(dataDir, 'memoryStore.json');

let store = {
  users: [],
  leads: [],
  templates: [],
  campaigns: [],
  uploads: [],
  emailLogs: [],
  settings: {}
};

// Load existing store if available
if (fs.existsSync(storeFile)) {
  try {
    const raw = fs.readFileSync(storeFile, 'utf8');
    store = { ...store, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[MemoryStore] Failed to load disk cache, using clean memory store.');
  }
}

const saveStore = () => {
  try {
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[MemoryStore] Disk sync warning:', err.message);
  }
};

const memoryStore = {
  getStore: () => store,
  saveStore,
  
  // User Helpers
  findUserByEmail: (email) => {
    const clean = (email || '').toLowerCase().trim();
    return store.users.find(u => u.email.toLowerCase() === clean);
  },
  findUserById: (id) => store.users.find(u => u._id === id || u.id === id),
  createUser: (userData) => {
    const newUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      ...userData,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);
    saveStore();
    return newUser;
  },

  // Lead Helpers
  getLeadsByUser: (userId) => store.leads.filter(l => l.user === userId || !l.user),
  createLead: (leadData) => {
    const newLead = {
      _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      score: 85,
      type: 'Business',
      contacted: false,
      ...leadData,
      createdAt: new Date().toISOString()
    };
    store.leads.unshift(newLead);
    saveStore();
    return newLead;
  },
  createBulkLeads: (leadsArray, userId) => {
    const added = [];
    for (const l of leadsArray) {
      if (!store.leads.some(existing => existing.email.toLowerCase() === (l.email || '').toLowerCase())) {
        const item = {
          _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          user: userId,
          owner: l.owner || 'Contact',
          email: l.email,
          phone: l.phone || '+1-555-0199',
          company: l.company || 'Enterprise',
          country: l.country || 'USA',
          type: l.type || 'Business',
          source: l.source || 'Lead Discovery',
          score: l.score || 88,
          contacted: false,
          createdAt: new Date().toISOString()
        };
        store.leads.unshift(item);
        added.push(item);
      }
    }
    saveStore();
    return added;
  },

  // Seed Default Demo Data for user
  seedDemoDataIfNeeded: (userId) => {
    const userLeads = store.leads.filter(l => l.user === userId);
    if (userLeads.length === 0) {
      const sample = [
        { owner: 'John Miller', email: 'john.miller@abccorp.com', phone: '+1-987-654-3210', company: 'ABC Wholesale Corp', country: 'USA', type: 'Business', source: 'CSV Import', score: 95, user: userId },
        { owner: 'David Sterling', email: 'david.sterling@xyzltd.co.uk', phone: '+44-20-7946-0922', company: 'XYZ Trading Ltd', country: 'UK', type: 'Business', source: 'Lead Discovery', score: 88, user: userId },
        { owner: 'Sarah Jenkins', email: 'sarah.jenkins@zenithwholesalers.com', phone: '+1-555-0192', company: 'Zenith Crafts & Wholesale', country: 'USA', type: 'Business', source: 'Lead Discovery', score: 92, user: userId },
        { owner: 'Girase Bhatu Test', email: 'girasebhatu70@gmail.com', phone: '+91-9876543210', company: 'Girase Enterprises', country: 'India', type: 'Business', source: 'Manual', score: 99, user: userId }
      ];
      sample.forEach(s => memoryStore.createLead(s));

      const sampleTpl = {
        _id: 'tpl_' + Date.now(),
        name: 'Product Introduction & Wholesale Catalog',
        subject: 'Handcrafted Wholesale Products Partnership for {{businessName}}',
        htmlContent: `<p>Hello {{ownerName}},</p>\n\n<p>We are pleased to introduce our handcrafted product collection to {{businessName}}.</p>\n\n<p>Please find our complete catalog attached. We would love to discuss custom wholesale rates for {{country}}.</p>\n\n<p>Best regards,<br>Sales Director<br>WhatsApp: {{phone}}</p>\n\n<p><a href="{{unsubscribeUrl}}">Unsubscribe from future updates</a></p>`,
        user: userId,
        createdAt: new Date().toISOString()
      };
      store.templates.push(sampleTpl);
      saveStore();
    }
  }
};

module.exports = memoryStore;
