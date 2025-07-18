const nodemailer = require('nodemailer');
const xss = require('xss');

// POST /api/send-message
exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  const safeMessage = xss(message);
  try {
    // Transporter config from env
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Structured email
    const mailOptions = {
      from: `AgriConnect <${process.env.EMAIL_USER}>`,
      to: 'connect.agriconnect@gmail.com',
      subject: 'New Message from AgriConnect User',
      text: `A new message was submitted on About page:\n\n${safeMessage}\n\nTime: ${new Date().toISOString()}`,
      html: `<h2>New Message from AgriConnect User</h2><p><b>Message:</b></p><pre>${safeMessage}</pre><p><b>Time:</b> ${new Date().toISOString()}</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};
