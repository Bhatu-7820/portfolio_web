const express = require('express');
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate
} = require('../controllers/templateController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTemplates)
  .post(createTemplate);

router.post('/:id/duplicate', duplicateTemplate);

router.route('/:id')
  .get(getTemplateById)
  .put(updateTemplate)
  .delete(deleteTemplate);

module.exports = router;

