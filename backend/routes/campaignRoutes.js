const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  createCampaign,
  getCampaignById,
  deleteCampaign
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/:id')
  .get(getCampaignById)
  .delete(deleteCampaign);

module.exports = router;
