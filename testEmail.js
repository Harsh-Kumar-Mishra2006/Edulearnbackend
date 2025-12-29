require('dotenv').config();
const nodemailer = require('nodemailer'); // Add this import
const transporter = require('./config/emailConfig');

async function testConnection() {
  try {
    console.log('🔍 Testing email configuration...');
    console.log('📧 Email:', process.env.EMAIL_USER);
    console.log('🔑 Password length:', process.env.EMAIL_PASS?.length);
    
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP Connection Successful!');
    
    // Test sending
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'hr.jaitsolution@gmail.com', // Send to support email
      subject: 'Test Email from EduLearn Server',
      text: 'This is a test email to verify the server is working!',
      html: '<h1>Test Email</h1><p>This is a test email to verify the server is working!</p>'
    });
    
    console.log('✅ Test email sent! Message ID:', info.messageId);
    
    // Check if getTestMessageUrl exists (for Mailtrap)
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('✅ Preview URL:', previewUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ Email Test Failed:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Go to: https://myaccount.google.com/apppasswords');
      console.log('2. Generate a NEW 16-character app password');
      console.log('3. Update .env file with the new password');
    }
  }
}

testConnection();