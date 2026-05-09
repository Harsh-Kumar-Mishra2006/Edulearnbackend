// controllers/personalInfoController.js
const PersonalInfo = require('../models/formdatapersonal');
const Auth = require('../models/authdata');

const savePersonalInfo = async (req, res) => {
  try {
    const { name, age, gender, email, phone, dob } = req.body;
    
    console.log('📝 Received personal info:', { name, age, gender, email, phone, dob });
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }
    
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    
    // Convert phone to string if it's a number
    const phoneString = String(phone);
    
    let personalInfo;
    const existingInfo = await PersonalInfo.findOne({ email });
    
    if (existingInfo) {
      // Update existing record
      personalInfo = await PersonalInfo.findByIdAndUpdate(
        existingInfo._id, 
        { 
          name, 
          age, 
          gender, 
          email, 
          phone: phoneString,
          dob 
        },
        { new: true }
      );
      console.log('✅ Updated existing personal info for:', email);
    } else {
      // Create new record
      personalInfo = new PersonalInfo({ 
        name, 
        age, 
        gender, 
        email, 
        phone: phoneString,
        dob 
      });
      await personalInfo.save();
      console.log('✅ Created new personal info for:', email);
    }
    
    // Update Auth profile with phone number
    try {
      const user = await Auth.findOne({ email });
      if (user) {
        // Update the auth record with phone number
        user.phone = phoneString;
        user.name = name;
        
        // Update profile object
        user.profile = {
          ...user.profile,
          age: age ? String(age) : user.profile?.age || '',
          gender: gender || user.profile?.gender || '',
          dob: dob || user.profile?.dob || '',
          phone: phoneString // Also store phone in profile for redundancy
        };
        
        await user.save();
        console.log(`✅ Updated auth profile for ${user.role}: ${email}, Phone: ${phoneString}`);
      } else {
        console.log(`⚠️ No auth user found for email: ${email}`);
      }
    } catch (userUpdateError) {
      console.error('Error updating user profile:', userUpdateError);
      // Don't fail the request if auth update fails
    }
    
    res.json({ 
      success: true, 
      message: existingInfo ? "Personal info updated successfully" : "Personal info saved successfully", 
      data: {
        ...personalInfo.toObject(),
        phone: phoneString
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving personal info:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "A record with this email already exists",
        field: "email"
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      details: "Failed to save personal information"
    });
  }
};

// Add a function to get personal info by email
const getPersonalInfoByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const personalInfo = await PersonalInfo.findOne({ email });
    
    if (!personalInfo) {
      return res.status(404).json({ 
        success: false, 
        message: "No personal info found for this email" 
      });
    }
    
    res.json({ 
      success: true, 
      data: personalInfo 
    });
    
  } catch (error) {
    console.error('Error fetching personal info:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { savePersonalInfo, getPersonalInfoByEmail };