const CourseInfo = require('../models/formdatacourse');
const PersonalInfoModel = require('../models/formdatapersonal');
const BackgroundInfoModel = require('../models/formdatabackground');

const saveCourseInfo = async (req, res) => {
  try {
    console.log('=== 🟡 COURSE INFO REQUEST START ===');
    console.log('1. Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, currentskills, fieldofstudy, language, goals, background, timecommitment } = req.body;

    // Validate required fields
    if (!email || !currentskills || !fieldofstudy || !language || !goals || !background || !timecommitment) {
      console.log('🔴 2. Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    // Validate email in personal and background info
    console.log('🟡 3. Checking personal info for:', email);
    const personalInfo = await PersonalInfoModel.findOne({ email });
    
    console.log('🟡 4. Checking background info for:', email);
    const backgroundInfo = await BackgroundInfoModel.findOne({ email });

    if(!personalInfo || !backgroundInfo) {
      console.log('🔴 5. Personal or background info not found');
      return res.status(400).json({  // ✅ ADDED return
        success: false,
        error: "Please complete personal and background information first" 
      });
    }

    console.log('🟢 6. Both personal and background info found');

    // Save and update course info
    console.log('🟡 7. Checking for existing course info...');
    let courseDetails = await CourseInfo.findOne({ email });
    console.log('🟡 8. Existing course info:', courseDetails);
    
    if(courseDetails) {
      console.log('🟡 9. Updating existing course info');
      courseDetails = await CourseInfo.findByIdAndUpdate(
        courseDetails._id,
        req.body,
        { new: true }
      );
    } else {
      console.log('🟡 10. Creating new course info');
      courseDetails = new CourseInfo(req.body);
      await courseDetails.save();
    }

    console.log('🟢 11. Course info saved successfully');

    res.json({
      success: true,
      message: "Course information saved successfully",
      data: courseDetails,
    });

  } catch (error) {
    console.error('🔴 12. ERROR in saveCourseInfo:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = { saveCourseInfo };