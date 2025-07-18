const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/emailController');
const { validate, emailSchemas } = require('../utils/validation');

// POST /api/send-message
router.post('/send-message', validate(emailSchemas.sendMessage), sendMessage);

module.exports = router;
