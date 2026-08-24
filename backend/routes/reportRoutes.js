const express = require('express');
const router = express.Router();
const { getDashboardReports, getCampaignReportDetail } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getDashboardReports);
router.get('/dashboard', getDashboardReports);
router.get('/campaign/:id', getCampaignReportDetail);

module.exports = router;
