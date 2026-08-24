# EmailPro — Lead Generation & Email Campaign Management Platform

EmailPro is a production-grade full-stack MERN (MongoDB, Express, React, Node.js) application designed to unify the end-to-end B2B and B2C sales outreach workflow into a single, cohesive SaaS dashboard.

---

## 🌟 Key Features

1. **JWT Authentication & Profile Management**
   - Secure registration, login, and token session verification powered by `bcryptjs` and `jsonwebtoken`.
   - Custom SMTP sender profile settings per user account.

2. **Real-time Executive Dashboard**
   - Live analytics connected to MongoDB: Total Leads, Business/Individual count, Contacts, Available Emails, Sent/Failed/Pending counts, and Campaign Success Ratios.
   - Dynamic activity tables for recent leads and campaign performance.

3. **Targeted Lead Generation Engine**
   - Query external web APIs or fallback to the development Lead Search Service with criteria (Search Keywords, Countries, Limit, Seed URLs).
   - Instant B2B/B2C lead scoring, regional mapping, and single-click batch commit into MongoDB.

4. **Central Lead Database & CRUD**
   - Full lead lifecycle management combining generated leads, CSV imports, and manually created contacts.
   - Filter pills (All, Business, Individual, Contacted, Not Contacted), search, pagination, and multi-select bulk actions.

5. **Batch CSV Lead Import**
   - Drag-and-drop CSV importer (`BusinessEmails.csv`, `IndividualsEmails.csv`).
   - Automated email validation, duplicate detection against existing database records, and rejection summary breakdown.

6. **B2B / B2C Lead Classification**
   - Real-time classification segment breakdown (Business vs. Individual vs. Unclassified).
   - Single-click quick classifier and bulk segment tagging.

7. **Product Catalog Attachment Manager**
   - Upload and manage PDF, DOC, and DOCX product catalog files using `Multer`.
   - Instant preview, stream download, and one-click campaign attachment linking.

8. **Dynamic Personalization Email Templates**
   - HTML template builder supporting variable tags: `{{ownerName}}`, `{{businessName}}`, `{{email}}`, `{{phone}}`, `{{country}}`, `{{unsubscribeUrl}}`.
   - Click-to-insert variable pills and live HTML preview modal.

9. **Email Campaign Wizard**
   - Build targeted outreach campaigns with audience filters (All Leads, Business Leads, Individual Leads).
   - Recipient count estimation prior to launch.

10. **Nodemailer SMTP Dispatcher (Individual & Bulk)**
    - Real SMTP/Gmail delivery or development Ethereal transporter fallback.
    - Rate-limited per-recipient async queue preventing provider throttling.
    - Resilient error handling so individual delivery failures do not block remaining recipients.

11. **Email Logs & Detailed Reports**
    - Per-recipient `EmailLog` tracking status (`pending`, `sent`, `failed`) and detailed delivery error tracebacks.
    - Campaign-level drilldown modals with success percentage metrics.

12. **One-Click Unsubscribe Preference Center**
    - Public secure token link generator (`/api/unsubscribe/:token`).
    - Automatic skipping of unsubscribed recipients prior to dispatch.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM v6
- **Backend**: Node.js, Express.js, MongoDB, Mongoose ORM
- **Security & Utils**: JWT, bcryptjs, Helmet, CORS, Multer, Nodemailer, csv-parser, dotenv

---

## 📂 Folder Structure

```text
Project_21/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── leadController.js
│   │   ├── campaignController.js
│   │   ├── emailController.js
│   │   ├── uploadController.js
│   │   ├── reportController.js
│   │   ├── templateController.js
│   │   ├── settingController.js
│   │   └── unsubscribeController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Campaign.js
│   │   ├── EmailTemplate.js
│   │   ├── EmailLog.js
│   │   └── UploadedFile.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── emailRoutes.js
│   │   ├── uploadRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── templateRoutes.js
│   │   ├── settingRoutes.js
│   │   └── unsubscribeRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── leadSearchService.js
│   ├── uploads/
│   │   ├── catalogs/
│   │   └── csvs/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── LeadTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Pagination.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LeadGeneration.jsx
│   │   │   ├── Leads.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Classification.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Templates.jsx
│   │   │   ├── SendEmail.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Unsubscribe.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── sample_data/
    ├── BusinessEmails.csv
    └── IndividualsEmails.csv
```

---

## 🚀 Quick Start Guide

### Single Command Execution (Recommended)
Run both backend and frontend concurrently from the root directory:

```bash
npm install
npm run dev
```

- **Backend Express API**: `http://localhost:5000`
- **Frontend Vite SaaS App**: `http://localhost:5173`

---

### Separate Process Execution (Optional)

#### Backend:
```bash
cd backend
npm install
npm start
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Render Deployment Guide (Recommended)

Deploying EmailPro to **Render.com** is configured and ready! You can deploy in two ways:

---

### Option 1: 1-Click Automated Render Blueprint (Simplest & Fast)

1. Push your repository to **GitHub**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprints**.
4. Connect your GitHub repository (`Project_21`).
5. Render will auto-detect `render.yaml` and configure:
   - Service Name: `emailpro-fullstack`
   - Build Command: `npm run render-build`
   - Start Command: `npm start`
6. Supply environment variables when prompted:
   - `MONGODB_URI`: Your MongoDB Atlas URL (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/emailpro`)
   - `JWT_SECRET`: (Auto-generated or enter a random string)
   - `SMTP_USER`: `girasebhatu70@gmail.com`
   - `SMTP_PASSWORD`: Your 16-character Google App Password
7. Click **Apply**. Render will build and launch your full-stack Glassmorphism EmailPro SaaS application live on `https://emailpro-fullstack.onrender.com`!

---

### Option 2: Manual Render Web Service Deployment

1. Push your code to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com) -> **New +** -> **Web Service**.
3. Connect your repository.
4. Fill in settings:
   - **Name**: `emailpro-app`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
5. Add **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=emailpro_jwt_secret_key_2026_super_secure_987654
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=girasebhatu70@gmail.com
   SMTP_PASSWORD=your_16_char_google_app_password
   ```
6. Click **Create Web Service**. Render will deploy your application live!

---


```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/emailpro
JWT_SECRET=emailpro_jwt_secret_key_2026_super_secure_987654
JWT_EXPIRE=30d
NODE_ENV=development

# Optional SMTP Settings (Default Ethereal/Mock Fallback Mode if blank)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_NAME=EmailPro Sales Team
SENDER_EMAIL=your_email@gmail.com

CLIENT_URL=http://localhost:5173
```

---

## 📡 Key API Routes

### Authentication
- `POST /api/auth/register` — Create account & return JWT
- `POST /api/auth/login` — Authenticate & return JWT
- `GET  /api/auth/me` — Fetch current user profile

### Leads & Discovery
- `GET    /api/leads` — Query leads with filters, search & pagination
- `POST   /api/leads` — Create lead record
- `POST   /api/leads/search` — Execute B2B/B2C lead discovery query
- `POST   /api/leads/bulk` — Save batch leads into database
- `PUT    /api/leads/:id/classify` — Update single lead classification
- `POST   /api/leads/bulk-classify` — Bulk classify leads

### Media & Uploads
- `POST   /api/uploads/csv` — Parse & import CSV lead list
- `POST   /api/uploads/catalog` — Upload Product Catalog PDF/DOC
- `GET    /api/uploads` — Get uploaded catalog list

### Email & Campaigns
- `GET    /api/templates` — Fetch email templates
- `POST   /api/campaigns` — Create outreach campaign
- `POST   /api/emails/send` — Send individual email via Nodemailer
- `POST   /api/emails/send-bulk` — Execute bulk campaign email dispatch
- `GET    /api/emails/logs` — Fetch per-recipient email delivery logs
- `GET    /api/reports` — Fetch aggregated dashboard analytics

### Unsubscribe
- `GET    /api/unsubscribe/:token` — Verify recipient token
- `POST   /api/unsubscribe/:token` — Mark lead as unsubscribed

---

## 📄 Sample CSV Format (`sample_data/BusinessEmails.csv`)

```csv
name,email,phone,country,company,type
John Miller,john.miller@abccorp.com,+1-987-654-3210,USA,ABC Corp,Business
David Sterling,david.sterling@xyzltd.co.uk,+44-20-7946-0922,UK,XYZ Ltd,Business
```

---

## ✉️ Sample Dynamic Template

```html
<p>Hello {{ownerName}},</p>

<p>We are pleased to introduce our handcrafted wholesale catalog to {{businessName}}.</p>

<p>Please find our catalog PDF attached for details.</p>

<p>WhatsApp: {{phone}}</p>

<p><a href="{{unsubscribeUrl}}">Unsubscribe from future emails</a></p>
```

---

## 🧪 Testing Complete Scenario

1. Register an account and log in.
2. Go to **Lead Generation**, search for `singing bowls wholesale`, and click **Save All Leads**.
3. Go to **Upload**, select `sample_data/BusinessEmails.csv`, and click **Process & Upload CSV**.
4. Go to **Classification**, click **Mark as Business** for unassigned leads.
5. Go to **Upload -> Product Catalogs**, upload a product catalog PDF.
6. Go to **Email Templates**, design a template using `{{ownerName}}` & `{{unsubscribeUrl}}`.
7. Go to **Campaigns**, build a new campaign targeting **Business Leads** and select your PDF catalog.
8. Click **Send Campaign Bulk** and inspect live execution progress.
9. Go to **Reports** to review delivery logs and success percentages.
10. Click the unsubscribe link in any sent email preview to confirm opt-out filtering.
