//controllers/formControllerbackground
const BackgroundInfo = require('../models/formdatabackground');
const PersonalInfoModel = require('../models/formdatapersonal');

const saveBackgroundInfo = async (req, res) => {
  try {
    console.log('=== 🟡 BACKGROUND INFO REQUEST START ===');
    console.log('1. Full request body:', JSON.stringify(req.body, null, 2));
    
    const { educationalqualification, currentstatus, profession, fieldofstudy, email } = req.body;
    
    // Check each field individually
    console.log('2. Email:', email);
    console.log('3. Educational qualification:', educationalqualification);
    console.log('4. Current status:', currentstatus);
    console.log('5. Profession:', profession);
    console.log('6. Field of study:', fieldofstudy);
    
    // Validate required fields with specific messages
    if (!email) {
      console.log('🔴 7. Validation failed: Email missing');
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }
    
    if (!educationalqualification) {
      console.log('🔴 8. Validation failed: Educational qualification missing');
      return res.status(400).json({
        success: false,
        error: "Educational qualification is required"
      });
    }
    
    if (!currentstatus) {
      console.log('🔴 9. Validation failed: Current status missing');
      return res.status(400).json({
        success: false,
        error: "Current status is required"
      });
    }

    console.log('🟡 10. All required fields present');
    
    // Validate email in personal info 
    console.log('🟡 11. Checking personal info for email:', email);
    const personalInfo = await PersonalInfoModel.findOne({ email });
    
    if(!personalInfo) {
      console.log('🔴 12. Personal info not found for email:', email);
      return res.status(400).json({
        success: false,
        error: "Please complete personal information first. No record found for email: " + email
      });
    }
    
    console.log('🟢 13. Personal info found:', personalInfo.email);
    
    // Save and update background info
    console.log('🟡 14. Checking for existing background info...');
    let backgroundInfo = await BackgroundInfo.findOne({ email });
    console.log('🟡 15. Existing background info:', backgroundInfo);
    
    if(backgroundInfo) {
      console.log('🟡 16. Updating existing background info');
      backgroundInfo = await BackgroundInfo.findByIdAndUpdate(
        backgroundInfo._id,
        req.body,
        { new: true }
      );
    } else {
      console.log('🟡 17. Creating new background info');
      backgroundInfo = new BackgroundInfo(req.body);
      await backgroundInfo.save();
    }
    
    console.log('🟢 18. Background info saved successfully');
    
    res.json({ 
      success: true, 
      message: "Background information saved successfully", 
      data: backgroundInfo 
    });
    
  } catch (error) {
    console.error('🔴 19. ERROR CAUGHT:', error.message);
    console.error('🔴 20. Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: "Server error: " + error.message 
    });
  }
};

module.exports = { saveBackgroundInfo };