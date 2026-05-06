const PersonalInfo = require('../models/formdatapersonal');
const Auth = require('../models/authdata');

const savePersonalInfo = async (req, res) => {
  try {
    const { name, age, gender, email, phone, dob } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }
    
    // ✅ UPDATE PERSONALINFO MODEL WITH PHONE TOO
    let personalInfo;
    const existingInfo = await PersonalInfo.findOne({ email });
    
    if (existingInfo) {
      personalInfo = await PersonalInfo.findByIdAndUpdate(
        existingInfo._id, 
        { ...req.body, phone: phone }, // Ensure phone is included
        { new: true }
      );
    } else {
      personalInfo = new PersonalInfo({ ...req.body, phone: phone });
      await personalInfo.save();
    }
    
    // Update Auth profile
    try {
      const user = await Auth.findOne({ email });
      if (user && user.role === 'student') {
        user.name = name;
        user.phone = phone; // This updates Auth phone
        
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

module.exports = {savePersonalInfo };