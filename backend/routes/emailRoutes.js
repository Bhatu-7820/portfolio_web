const express = require('express');
const router = express.Router();
const { sendSingleEmail, sendBulkEmail, getEmailLogs, sendTestEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/send', sendSingleEmail);
router.post('/send-bulk', sendBulkEmail);
router.post('/test-send', sendTestEmail);
router.get('/logs', getEmailLogs);

module.exports = router;

