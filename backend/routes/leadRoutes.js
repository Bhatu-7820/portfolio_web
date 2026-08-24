const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  searchExternalLeads,
  saveBulkLeads,
  classifyLead,
  bulkClassifyLeads,
  bulkDeleteLeads,
  clearAllLeads,
  exportLeads
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.get('/export', exportLeads);
router.post('/search', searchExternalLeads);
router.post('/bulk', saveBulkLeads);
router.post('/bulk-classify', bulkClassifyLeads);
router.post('/bulk-delete', bulkDeleteLeads);
router.post('/clear-all', clearAllLeads);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(deleteLead);

router.put('/:id/classify', classifyLead);

module.exports = router;

