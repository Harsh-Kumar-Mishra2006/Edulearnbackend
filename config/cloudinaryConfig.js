// config/cloudinaryConfig.js - UPDATED
const cloudinary = require('cloudinary').v2;

// Check if environment variables are set
console.log('=== CLOUDINARY CONFIGURATION CHECK ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'NOT SET!');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'NOT SET!');

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY CREDENTIALS MISSING!');
  console.error('Please check your .env file or Render environment variables');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  
  // For development, you can set fallback values (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Using placeholder values for development only');
    process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dpsssv5tg';
    process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '479132539596339';
    process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '7ljZQrNMqkKKQIrN3MTc2SX_6z4';
  }
}

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  
  console.log('✅ Cloudinary configured successfully');
  console.log('Cloud Name:', cloudinary.config().cloud_name);
  
  // Test configuration with a simple API call
  cloudinary.api.ping()
    .then(result => console.log('✅ Cloudinary API connection test:', result))
    .catch(err => console.error('❌ Cloudinary API test failed:', err.message));
    
} catch (error) {
  console.error('❌ Failed to configure Cloudinary:', error.message);
  console.error('Please verify your credentials at: https://console.cloudinary.com/settings/account');
}

module.exports = cloudinary;