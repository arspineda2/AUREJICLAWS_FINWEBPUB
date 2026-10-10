const nodemailer = require("nodemailer");
require("dotenv").config();

// Create the shared email engine using your environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;