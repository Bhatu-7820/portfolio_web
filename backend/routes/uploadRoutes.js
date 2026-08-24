const express = require('express');
const router = express.Router();
const {
  uploadCSVLeads,
  uploadCatalogFile,
  getUploadedFiles,
  deleteUploadedFile,
  getFileByFilename
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { uploadCSV, uploadCatalog } = require('../middleware/uploadMiddleware');

router.post('/csv', protect, uploadCSV.single('file'), uploadCSVLeads);
router.post('/catalog', protect, uploadCatalog.single('file'), uploadCatalogFile);
router.get('/', protect, getUploadedFiles);
router.delete('/:id', protect, deleteUploadedFile);

// Public route to view / serve files
router.get('/file/:filename', getFileByFilename);

module.exports = router;
