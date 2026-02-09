// controllers/studentDownloadController.js - NEW FILE
const CourseMaterial = require('../models/courseMaterialdata');
const StudentEnrollment = require('../models/Mylearningmodel');
const cloudinary = require('../config/cloudinaryConfig');

// Download video
const downloadVideo = async (req, res) => {
  try {
    const { course_id, video_id } = req.params;
    const student_email = req.user.email;

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Not enrolled' });
    }

    // Get course and video
    const course = await CourseMaterial.findById(course_id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const video = course.materials.videos.id(video_id);
    if (!video) return res.status(404).json({ success: false, error: 'Video not found' });

    if (!video.is_public) {
      return res.status(403).json({ success: false, error: 'Video not available' });
    }

    // Get Cloudinary URL
    let downloadUrl = video.video_url;
    
    // If no URL but has public_id, construct it
    if (!downloadUrl && video.public_id) {
      downloadUrl = `https://res.cloudinary.com/dpsssv5tg/video/upload/${video.public_id}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Video URL not found' });
    }

    // Redirect to Cloudinary for download
    res.redirect(downloadUrl);

  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download document
const downloadDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;
    const student_email = req.user.email;

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Not enrolled' });
    }

    // Get course and document
    const course = await CourseMaterial.findById(course_id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const document = course.materials.documents.id(document_id);
    if (!document) return res.status(404).json({ success: false, error: 'Document not found' });

    if (!document.is_public) {
      return res.status(403).json({ success: false, error: 'Document not available' });
    }

    // Get Cloudinary URL
    let downloadUrl = document.file_url;
    
    // If no URL but has public_id, construct it
    if (!downloadUrl && document.public_id) {
      const resourceType = document.file_type === 'pdf' ? 'image' : 'raw';
      downloadUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${document.public_id}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Document URL not found' });
    }

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name || document.title}"`);
    res.redirect(downloadUrl);

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// View file (inline)
// Fix the viewFile function in studentDownloadController.js
const viewFile = async (req, res) => {
  try {
    const { public_id } = req.params;
    const student_email = req.user.email;

    // Check if student has access to this specific file
    // Find any course that has this file and student is enrolled in that course category
    const enrollments = await StudentEnrollment.find({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (enrollments.length === 0) {
      return res.status(403).json({ success: false, error: 'Not enrolled in any courses' });
    }

    const enrolledCategories = enrollments.map(e => e.course_category);
    
    // Find a course that contains this public_id and student has access to
    const course = await CourseMaterial.findOne({
      course_category: { $in: enrolledCategories },
      $or: [
        { 'materials.videos.public_id': public_id },
        { 'materials.documents.public_id': public_id }
      ]
    });

    if (!course) {
      return res.status(403).json({ 
        success: false, 
        error: 'File not found or access denied' 
      });
    }

    // Determine resource type and construct URL
    let resourceType = 'raw';
    
    // Check if it's a video
    const video = course.materials.videos.find(v => v.public_id === public_id);
    if (video) {
      resourceType = 'video';
    }
    
    // Check if it's a document
    const document = course.materials.documents.find(d => d.public_id === public_id);
    if (document) {
      resourceType = document.file_type === 'pdf' ? 'image' : 'raw';
    }

    // Construct Cloudinary URL
    const viewUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${public_id}`;
    
    // Redirect to Cloudinary for viewing
    res.redirect(viewUrl);

  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  downloadVideo,
  downloadDocument,
  viewFile
};