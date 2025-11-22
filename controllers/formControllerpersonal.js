const PersonalInfo = require('../models/formdatapersonal');

//personal form data controller
const savePersonalInfo = async (req, res) => {
  try {
    const { name,age,gender,email,phone,dob } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }
    
    // Check if user already exists (by email)
    const existingInfo = await PersonalInfo.findOne({ email });
    if (existingInfo) {
      // Update existing record
      const updatedInfo = await PersonalInfo.findByIdAndUpdate(
        existingInfo._id, 
        req.body, 
        { new: true }
      );
      return res.json({ 
        success: true, 
        message: "Personal info updated", 
        data: updatedInfo 
      });
    }
    
    // Create new record
    const personalInfo = new PersonalInfo(req.body);
    await personalInfo.save();
    
    res.json({ 
      success: true, 
      message: "Personal info saved", 
      data: personalInfo 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { savePersonalInfo };