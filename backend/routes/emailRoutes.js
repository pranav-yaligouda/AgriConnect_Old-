const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/emailController');

// POST /api/send-message
router.post('/send-message', sendMessage);

module.exports = router;
