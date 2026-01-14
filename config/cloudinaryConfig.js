// config/cloudinaryConfig.js - FIXED PRODUCTION VERSION
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables based on environment
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Enhanced configuration check
const configureCloudinary = () => {
  console.log('=== CLOUDINARY CONFIGURATION CHECK ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'Not set');
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'NOT SET!');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'NOT SET!');

  // Check all required variables
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ MISSING CLOUDINARY CREDENTIALS:', missingVars);
    
    // Don't use fallback values in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing Cloudinary credentials: ${missingVars.join(', ')}`);
    } else {
      console.warn('⚠️  Development mode: Using test credentials (if available)');
    }
  }

  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    console.log('✅ Cloudinary configured successfully');
    console.log('Cloud Name:', cloudinary.config().cloud_name);
    
    // Test connection (async)
    cloudinary.api.ping()
      .then(result => {
        console.log('✅ Cloudinary API connection test successful');
        console.log('  Status:', result.status);
        console.log('  Rate limit remaining:', result.rate_limit_remaining);
      })
      .catch(err => {
        console.error('❌ Cloudinary API test failed:', err.message);
        console.error('  Please check your credentials at: https://console.cloudinary.com/settings/account');
        
        if (process.env.NODE_ENV === 'production') {
          // Don't crash in production, but log error
          console.error('⚠️  Continuing without Cloudinary test - uploads may fail');
        }
      });
      
    return cloudinary;
    
  } catch (error) {
    console.error('❌ Failed to configure Cloudinary:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      throw error; // Crash in production if Cloudinary fails
    }
    
    return null; // Return null in development
  }
};

// Initialize immediately
const cloudinaryInstance = configureCloudinary();

module.exports = cloudinaryInstance;