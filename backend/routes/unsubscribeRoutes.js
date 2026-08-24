const express = require('express');
const router = express.Router();
const { getUnsubscribeStatus, processUnsubscribe } = require('../controllers/unsubscribeController');

router.get('/:token', getUnsubscribeStatus);
router.post('/:token', processUnsubscribe);

module.exports = router;
