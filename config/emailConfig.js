// config/emailConfig.js - SIMPLIFIED UNIVERSAL VERSION
const nodemailer = require('nodemailer');

const getTransporterConfig = () => {
  const emailHost = process.env.EMAIL_HOST || '';
  
  // If using SendGrid (Render production)
  if (emailHost.includes('sendgrid.net')) {
    console.log('📧 Using SendGrid configuration');
    return {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
    };
  }
  
  // Default to Gmail (local development)
  console.log('📧 Using Gmail configuration');
  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };
};

const transporter = nodemailer.createTransport(getTransporterConfig());

// Simple verification
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️ Email verification failed on startup:', error.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

module.exports = transporter;