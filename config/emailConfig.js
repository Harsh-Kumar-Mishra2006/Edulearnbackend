// config/emailConfig.js - UNIVERSAL VERSION
const nodemailer = require('nodemailer');

// Detect environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

const getTransporterConfig = () => {
  if (isProduction && process.env.EMAIL_SERVICE === 'sendgrid') {
    // SendGrid configuration for Render
    return {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASS, // SendGrid API Key
      }
    };
  } else {
    // Gmail configuration for local development
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false
      }
    };
  }
};

// Create transporter
const transporter = nodemailer.createTransport(getTransporterConfig());

// Verify connection (with better error handling)
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log(`✅ Email server ready (${isProduction ? 'SendGrid' : 'Gmail'})`);
    return true;
  } catch (error) {
    if (isProduction) {
      console.warn(`⚠️ SendGrid connection failed on startup: ${error.message}`);
      console.log('📧 Emails may fail in production. Check SendGrid configuration.');
    } else {
      console.error(`❌ Gmail connection failed: ${error.message}`);
    }
    return false;
  }
};

// Call verification on startup
verifyEmailConnection();

module.exports = transporter;