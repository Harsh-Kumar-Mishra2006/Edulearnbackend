// formcoursecontroller.js - UPDATED VERSION
const CourseInfo = require('../models/formdatacourse');
const PersonalInfoModel = require('../models/formdatapersonal');
const BackgroundInfoModel = require('../models/formdatabackground');

const saveCourseInfo = async (req, res) => {
  try {
    console.log('=== 🟡 COURSE INFO REQUEST START ===');
    console.log('1. Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, currentskills, fieldofstudy, language, goals, background, timecommitment } = req.body;

    // ✅ FIXED: Only validate REQUIRED fields
    if (!email) {
      console.log('🔴 2. Missing email');
      return res.status(400).json({ 
        success: false,
        error: "Email is required" 
      });
    }
    
    if (!currentskills) {
      console.log('🔴 2. Missing current skills');
      return res.status(400).json({ 
        success: false,
        error: "Current skills are required" 
      });
    }
    
    if (!fieldofstudy) {
      console.log('🔴 2. Missing field of study');
      return res.status(400).json({ 
        success: false,
        error: "Field of study is required" 
      });
    }
    
    if (!language) {
      console.log('🔴 2. Missing language');
      return res.status(400).json({ 
        success: false,
        error: "Language is required" 
      });
    }

    console.log('🟢 2. All required fields present');
    
    // ✅ Optional fields can be empty or undefined
    console.log('🟡 3. Optional fields status:');
    console.log('   - goals:', goals || '(empty)');
    console.log('   - background:', background || '(empty)');
    console.log('   - timecommitment:', timecommitment || '(empty)');

    // Validate email in personal and background info
    console.log('🟡 4. Checking personal info for:', email);
    const personalInfo = await PersonalInfoModel.findOne({ email });
    
    console.log('🟡 5. Checking background info for:', email);
    const backgroundInfo = await BackgroundInfoModel.findOne({ email });

    if(!personalInfo || !backgroundInfo) {
      console.log('🔴 6. Personal or background info not found');
      return res.status(400).json({ 
        success: false,
        error: "Please complete personal and background information first" 
      });
    }

    console.log('🟢 7. Both personal and background info found');

    // ✅ Create course info with optional fields (send empty strings if not provided)
    const courseData = {
      email,
      currentskills,
      fieldofstudy,
      language,
      goals: goals || '',        // Optional
      background: background || '',  // Optional
      timecommitment: timecommitment || ''  // Optional
    };

    // Save and update course info
    console.log('🟡 8. Checking for existing course info...');
    let courseDetails = await CourseInfo.findOne({ email });
    console.log('🟡 9. Existing course info:', courseDetails);
    
    if(courseDetails) {
      console.log('🟡 10. Updating existing course info');
      courseDetails = await CourseInfo.findByIdAndUpdate(
        courseDetails._id,
        courseData,
        { new: true }
      );
    } else {
      console.log('🟡 11. Creating new course info');
      courseDetails = new CourseInfo(courseData);
      await courseDetails.save();
    }

    console.log('🟢 12. Course info saved successfully:', courseDetails);

    res.json({
      success: true,
      message: "Course information saved successfully",
      data: courseDetails,
    });

  } catch (error) {
    console.error('🔴 13. ERROR in saveCourseInfo:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = { saveCourseInfo };