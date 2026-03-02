// controllers/studentDownloadController.js - FIXED FOR ROUTES
const CourseMaterial = require('../models/courseMaterialdata');
const StudentEnrollment = require('../models/Mylearningmodel');

// Download video
const downloadVideo = async (req, res) => {
  try {
    const { course_id, video_id } = req.params;
    const student_email = req.user.email;

    console.log('📥 Download video request:', { course_id, video_id, student_email });

    // Find the course
    const course = await CourseMaterial.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: course.course_category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      console.log('❌ No enrollment found for:', { student_email, category: course.course_category });
      return res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
    }

    // Find the video
    const video = course.materials.videos.id(video_id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Check if video is public
    if (!video.is_public) {
      return res.status(403).json({ success: false, error: 'This video is not available for download' });
    }

    // Get video URL
    let downloadUrl = video.video_url;
    
    // If no URL but has public_id, construct it
    if (!downloadUrl && video.public_id) {
      downloadUrl = `https://res.cloudinary.com/dpsssv5tg/video/upload/${video.public_id}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Video URL not found' });
    }

    console.log('✅ Video download authorized, redirecting to:', downloadUrl);

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

// controllers/studentDownloadController.js - LOCAL STORAGE VERSION

// Download document - LOCAL STORAGE ONLY
const downloadDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;
    const student_email = req.user.email;

    console.log('📥 Download document request:', { course_id, document_id, student_email });

    // Find the course
    const course = await CourseMaterial.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: course.course_category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      console.log('❌ No enrollment found for:', { student_email, category: course.course_category });
      return res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
    }

    // Find the document
    const document = course.materials.documents.id(document_id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Check if document is public
    if (!document.is_public) {
      return res.status(403).json({ success: false, error: 'This document is not available for download' });
    }

    // Get document URL (local storage)
    let downloadUrl = document.file_url;
    
    // If URL is relative, make it absolute
    if (downloadUrl && downloadUrl.startsWith('/')) {
      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
      downloadUrl = `${baseUrl}${downloadUrl}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Document URL not found' });
    }

    console.log('✅ Document download authorized, redirecting to:', downloadUrl);
    
    // For local files, add token as query parameter
    const token = req.headers.authorization?.split(' ')[1];
    const urlWithAuth = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}token=${token}`;
    
    return res.redirect(urlWithAuth);

  } catch (error) {
    console.error('❌ Download document error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// View document - LOCAL STORAGE ONLY
const viewDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;
    const student_email = req.user.email;

    console.log('👁️ View document request:', { course_id, document_id, student_email });

    // Find the course
    const course = await CourseMaterial.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: course.course_category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
    }

    // Find the document
    const document = course.materials.documents.id(document_id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (!document.is_public) {
      return res.status(403).json({ success: false, error: 'This document is not available' });
    }

    // Get document URL
    let viewUrl = document.file_url;
    
    if (!viewUrl) {
      return res.status(404).json({ success: false, error: 'Document URL not found' });
    }

    // If URL is relative, make it absolute
    if (viewUrl.startsWith('/')) {
      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
      viewUrl = `${baseUrl}${viewUrl}`;
    }

    console.log('✅ Document view authorized, redirecting to:', viewUrl);
    
    // Add token for local files
    const token = req.headers.authorization?.split(' ')[1];
    const urlWithAuth = `${viewUrl}${viewUrl.includes('?') ? '&' : '?'}token=${token}`;
    
    return res.redirect(urlWithAuth);

  } catch (error) {
    console.error('❌ View document error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
module.exports = {
  downloadVideo,
  downloadDocument,
  viewDocument
};