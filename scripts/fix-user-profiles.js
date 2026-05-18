// scripts/fix-user-profiles.js
const mongoose = require('mongoose');
const Auth = require('../models/authdata');

const fixUserProfiles = async () => {
  try {
    await mongoose.connect('YOUR_MONGODB_URL');
    
    // Find all users with empty profile fields
    const users = await Auth.find({
      role: 'student',
      $or: [
        { 'profile.age': { $exists: false } },
        { 'profile.age': '' },
        { 'profile.gender': { $exists: false } },
        { 'profile.gender': '' },
        { 'profile.dob': { $exists: false } },
        { 'profile.dob': '' }
      ]
    });
    
    console.log(`Found ${users.length} users with missing profile data`);
    
    for (const user of users) {
      // Initialize profile if it doesn't exist
      if (!user.profile) user.profile = {};
      
      // Set default empty values
      if (!user.profile.age) user.profile.age = '';
      if (!user.profile.gender) user.profile.gender = '';
      if (!user.profile.dob) user.profile.dob = '';
      
      await user.save();
      console.log(`✅ Fixed profile for: ${user.email}`);
    }
    
    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

fixUserProfiles();