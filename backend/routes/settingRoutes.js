const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, testSmtpConnection } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.post('/test-smtp', testSmtpConnection);

module.exports = router;
