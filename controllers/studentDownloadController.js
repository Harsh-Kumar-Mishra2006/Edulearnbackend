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

// Download document
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

    // Get document URL
    let downloadUrl = document.file_url;
    
    // If no URL but has public_id, construct it
    if (!downloadUrl && document.public_id) {
      const resourceType = document.file_type === 'pdf' ? 'image' : 'raw';
      downloadUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${document.public_id}`;
    }

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Document URL not found' });
    }

    console.log('✅ Document download authorized, redirecting to:', downloadUrl);

    // Set filename for download
    const filename = document.original_name || `${document.title}.${document.file_type}`;
    
    // For Cloudinary, add download flag
    if (downloadUrl.includes('cloudinary.com')) {
      if (downloadUrl.includes('/upload/')) {
        downloadUrl = downloadUrl.replace('/upload/', `/upload/fl_attachment:${filename}/`);
      }
      return res.redirect(downloadUrl);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.redirect(downloadUrl);

  } catch (error) {
    console.error('❌ Download document error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// View file - FIXED to handle both formats
const viewFile = async (req, res) => {
  try {
    const student_email = req.user.email;
    
    // Check if it's the new format with course_id and file_id
    if (req.params.course_id && req.params.file_id && req.params.file_type) {
      const { course_id, file_id, file_type } = req.params;
      
      console.log('👁️ View file request (with course context):', { course_id, file_id, file_type, student_email });

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

      let fileUrl = null;

      // Find the file based on type
      if (file_type === 'video') {
        const video = course.materials.videos.id(file_id);
        if (!video) {
          return res.status(404).json({ success: false, error: 'Video not found' });
        }
        if (!video.is_public) {
          return res.status(403).json({ success: false, error: 'This video is not available' });
        }
        fileUrl = video.video_url;
        
        if (!fileUrl && video.public_id) {
          fileUrl = `https://res.cloudinary.com/dpsssv5tg/video/upload/${video.public_id}`;
        }
      } else {
        const document = course.materials.documents.id(file_id);
        if (!document) {
          return res.status(404).json({ success: false, error: 'Document not found' });
        }
        if (!document.is_public) {
          return res.status(403).json({ success: false, error: 'This document is not available' });
        }
        fileUrl = document.file_url;
        
        if (!fileUrl && document.public_id) {
          const resourceType = document.file_type === 'pdf' ? 'image' : 'raw';
          fileUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${document.public_id}`;
        }
      }

      if (!fileUrl) {
        return res.status(404).json({ success: false, error: 'File URL not found' });
      }

      console.log('✅ File view authorized, redirecting to:', fileUrl);
      return res.redirect(fileUrl);
      
    } 
    // Handle old format with just public_id
    else if (req.params.public_id) {
      const { public_id } = req.params;
      
      console.log('👁️ View file request (public_id only):', { public_id, student_email });

      // Find any course that contains this public_id and student is enrolled in that category
      const enrollments = await StudentEnrollment.find({
        student_email,
        payment_status: 'verified',
        enrollment_status: 'active'
      });

      if (enrollments.length === 0) {
        return res.status(403).json({ success: false, error: 'Not enrolled in any courses' });
      }

      const enrolledCategories = enrollments.map(e => e.course_category);
      
      // Find a course that contains this public_id
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
      
      const video = course.materials.videos.find(v => v.public_id === public_id);
      if (video) {
        resourceType = 'video';
      }
      
      const document = course.materials.documents.find(d => d.public_id === public_id);
      if (document) {
        resourceType = document.file_type === 'pdf' ? 'image' : 'raw';
      }

      const viewUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${public_id}`;
      console.log('✅ File view authorized (public_id), redirecting to:', viewUrl);
      return res.redirect(viewUrl);
    }
    
    else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request. Provide either course_id/file_id or public_id' 
      });
    }

  } catch (error) {
    console.error('❌ View file error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  downloadVideo,
  downloadDocument,
  viewFile
};