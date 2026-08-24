const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDirs = () => {
  const catalogDir = path.join(__dirname, '../uploads/catalogs');
  const csvDir = path.join(__dirname, '../uploads/csvs');

  if (!fs.existsSync(catalogDir)) {
    fs.mkdirSync(catalogDir, { recursive: true });
  }
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }
};

createUploadDirs();

const catalogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/catalogs'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/csvs'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const catalogFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for catalog uploads'), false);
  }
};

const csvFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const uploadCatalog = multer({
  storage: catalogStorage,
  fileFilter: catalogFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { uploadCatalog, uploadCSV };
