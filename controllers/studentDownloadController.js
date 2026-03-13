// controllers/studentDownloadController.js - CLEANED VERSION
const CourseMaterial = require('../models/courseMaterialdata');
const StudentEnrollment = require('../models/Mylearningmodel');

// Download video ONLY - KEEP THIS
const downloadVideo = async (req, res) => {
  try {
    const { course_id, video_id } = req.params;
    const student_email = req.user.email;

    console.log('📥 Download video request:', { course_id, video_id, student_email });

    const course = await CourseMaterial.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: course.course_category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
    }

    const video = course.materials.videos.id(video_id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    if (!video.is_public) {
      return res.status(403).json({ success: false, error: 'This video is not available for download' });
    }

    let downloadUrl = video.video_url;
    
    if (!downloadUrl && video.public_id) {
      downloadUrl = `https://res.cloudinary.com/dpsssv5tg/video/upload/${video.public_id}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Video URL not found' });
    }

    // For Cloudinary videos, add download flag
    if (downloadUrl.includes('cloudinary.com')) {
      const filename = encodeURIComponent(video.title || 'video');
      if (downloadUrl.includes('/upload/')) {
        downloadUrl = downloadUrl.replace('/upload/', `/upload/fl_attachment:${filename}/`);
      }
    }

    return res.redirect(downloadUrl);

  } catch (error) {
    console.error('❌ Download video error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 🚨 REMOVE downloadDocument and viewDocument from here
// EXPORT ONLY downloadVideo
module.exports = {
  downloadVideo
  // NO document functions here!
};