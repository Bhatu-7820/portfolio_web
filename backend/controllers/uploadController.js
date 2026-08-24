const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const UploadedFile = require('../models/UploadedFile');
const memoryStore = require('../config/memoryStore');

// Helper function to validate email
const isValidEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase().trim());
};

// @desc    Upload & parse CSV file to import leads
// @route   POST /api/uploads/csv
// @access  Private
const uploadCSVLeads = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const defaultType = req.body.defaultType || 'Business';
    const filePath = req.file.path;
    const results = [];
    const rejectedRows = [];
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let duplicateCount = 0;
    let importedCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        totalRows++;
        const owner = row.name || row.owner || row['Contact Name'] || row['Full Name'] || row.Name || 'Unknown';
        const email = (row.email || row.Email || row['Email Address'] || '').trim().toLowerCase();
        const phone = row.phone || row.Phone || row['Phone Number'] || '';
        const country = row.country || row.Country || '';
        const company = row.company || row.Company || row['Company Name'] || '';
        const leadType = row.type || row.Type || defaultType;

        if (!email || !isValidEmail(email)) {
          invalidRows++;
          rejectedRows.push({ row: totalRows, data: row, reason: 'Invalid or missing email address' });
        } else {
          validRows++;
          results.push({
            owner,
            email,
            phone,
            country,
            company,
            type: ['Business', 'Individual'].includes(leadType) ? leadType : defaultType,
            rowNum: totalRows
          });
        }
      })
      .on('end', async () => {
        try {
          if (mongoose.connection.readyState !== 1) {
            const added = memoryStore.createBulkLeads(results, req.user._id);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json({
              success: true,
              summary: {
                totalRows,
                validRows,
                invalidRows,
                duplicates: Math.max(0, results.length - added.length),
                importedCount: added.length
              },
              rejectedRows
            });
          }

          for (const item of results) {
            const existing = await Lead.findOne({ user: req.user._id, email: item.email });
            if (existing) {
              duplicateCount++;
              rejectedRows.push({ row: item.rowNum, data: item, reason: 'Duplicate email in system' });
            } else {
              await Lead.create({
                owner: item.owner,
                email: item.email,
                phone: item.phone,
                country: item.country,
                company: item.company,
                type: item.type,
                source: 'CSV Import',
                score: 75,
                user: req.user._id
              });
              importedCount++;
            }
          }

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.json({
            success: true,
            summary: {
              totalRows,
              validRows,
              invalidRows,
              duplicates: duplicateCount,
              importedCount
            },
            rejectedRows
          });
        } catch (dbErr) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          next(dbErr);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ success: false, message: `CSV parsing error: ${err.message}` });
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product catalog PDF/DOC file
// @route   POST /api/uploads/catalog
// @access  Private
const uploadCatalogFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a catalog file (PDF, DOC, DOCX)' });
    }

    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const newFile = {
        _id: 'file_' + Date.now(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user._id
      };
      store.uploads.push(newFile);
      memoryStore.saveStore();
      return res.status(201).json({ success: true, message: 'Catalog uploaded successfully', file: newFile });
    }

    const uploadedFile = await UploadedFile.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Catalog uploaded successfully',
      file: uploadedFile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all uploaded catalogs for user
// @route   GET /api/uploads
// @access  Private
const getUploadedFiles = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      return res.json({ success: true, count: store.uploads.length, files: store.uploads });
    }

    const files = await UploadedFile.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: files.length, files });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete catalog file
// @route   DELETE /api/uploads/:id
// @access  Private
const deleteUploadedFile = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      store.uploads = store.uploads.filter(f => f._id !== req.params.id);
      memoryStore.saveStore();
      return res.json({ success: true, message: 'Catalog file deleted successfully' });
    }

    const file = await UploadedFile.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await UploadedFile.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Catalog file deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Download or serve catalog file
// @route   GET /api/uploads/file/:filename
// @access  Public / Authenticated
const getFileByFilename = async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '../uploads/catalogs', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found' });
    }
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCSVLeads,
  uploadCatalogFile,
  getUploadedFiles,
  deleteUploadedFile,
  getFileByFilename
};
