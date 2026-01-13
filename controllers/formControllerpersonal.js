const PersonalInfo = require('../models/formdatapersonal');
const Auth = require('../models/authdata');

const savePersonalInfo = async (req, res) => {
  try {
    const { name, age, gender, email, phone, dob } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }
    
    // Check if user already exists (by email)
    const existingInfo = await PersonalInfo.findOne({ email });
    let personalInfo;
    
    if (existingInfo) {
      // Update existing record
      personalInfo = await PersonalInfo.findByIdAndUpdate(
        existingInfo._id, 
        req.body, 
        { new: true }
      );
    } else {
      // Create new record
      personalInfo = new PersonalInfo(req.body);
      await personalInfo.save();
    }
    
    // ✅ ALSO UPDATE THE USER'S AUTH PROFILE FOR STUDENTS
    try {
      const user = await Auth.findOne({ email });
      if (user && user.role === 'student') {
        // Update user's profile with personal info
        user.name = name;
        user.phone = phone;
        
        // Update profile fields
        user.profile = {
          ...user.profile,
          age: age || user.profile?.age || '',
          gender: gender || user.profile?.gender || '',
          dob: dob || user.profile?.dob || ''
        };
        
        await user.save();
        console.log(`✅ Updated profile for student: ${email}`);
      }
    } catch (userUpdateError) {
      console.error('Error updating user profile:', userUpdateError);
      // Don't fail the main request if profile update fails
    }
    
    res.json({ 
      success: true, 
      message: existingInfo ? "Personal info updated" : "Personal info saved", 
      data: personalInfo 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { savePersonalInfo };