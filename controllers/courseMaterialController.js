// controllers/courseMaterialController.js
const CourseMaterial = require('../models/courseMaterialdata');
const Teacher = require('../models/adminadddata');
const { getVideoThumbnail } = require('../config/cloudinaryStorage');
const path = require('path');
const { 
  uploadVideo, 
  uploadDocument, 
  generateSignedUrl,
  deleteFile 
} = require('../config/cloudinaryStorage');

// Create new course (only basic info)
const createCourse = async (req, res) => {
  try {
    const { course_title, course_description, course_category, course_settings, tags } = req.body;

    if (!course_title || !course_category) {
      return res.status(400).json({
        success: false,
        error: "Course title and category are required"
      });
    }

    // Check if teacher already has a course with same title
    const existingCourse = await CourseMaterial.findOne({
      teacher_id: req.user.userId,
      course_title: course_title
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: "You already have a course with this title"
      });
    }

    const course = new CourseMaterial({
      teacher_id: req.user.userId,
      teacher_email: req.user.email,
      course_title,
      course_description,
      course_category,
      course_settings: course_settings || {},
      tags: tags || [],
      status: 'draft'
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      error: "Error creating course: " + error.message
    });
  }
};

// controllers/courseMaterialController.js - FIXED UPLOAD FUNCTIONS

// Upload video to course - COMPLETELY FIXED VERSION
const uploadVideoToCourse = async (req, res) => {
  try {
    console.log('📤 Saving video metadata...');
    console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));
    
    const { course_id } = req.params;
    const { title, description, cloudinary_url, cloudinary_public_id, file_size, mimetype, original_name, is_public } = req.body;

    // Check each required field
    const missingFields = [];
    if (!cloudinary_url) missingFields.push('cloudinary_url');
    if (!cloudinary_public_id) missingFields.push('cloudinary_public_id');
    if (!file_size) missingFields.push('file_size');
    if (!mimetype) missingFields.push('mimetype');
    if (!original_name) missingFields.push('original_name');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Find course
    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Generate thumbnail safely
    let thumbnail_url = null;
    try {
      // Check if getVideoThumbnail function exists
      if (typeof getVideoThumbnail === 'function') {
        thumbnail_url = getVideoThumbnail(cloudinary_public_id);
        console.log('🖼️ Generated thumbnail:', thumbnail_url);
      } else {
        console.log('⚠️ getVideoThumbnail function not available');
      }
    } catch (thumbError) {
      console.error('❌ Thumbnail generation error:', thumbError.message);
      // Continue without thumbnail
    }

    // Prepare video data - WITHOUT thumbnail if it failed
    const videoData = {
      title: title || `Video ${course.materials.videos.length + 1}`,
      description: description || '',
      video_url: cloudinary_url,
      public_id: cloudinary_public_id,
      duration: req.body.duration || '00:00',
      file_size: parseInt(file_size), // Ensure it's a number
      mimetype: mimetype,
      original_name: original_name,
      is_public: is_public === true || is_public === 'true',
      video_order: course.materials.videos.length,
      upload_date: new Date()
    };

    // Only add thumbnail_url if it was generated successfully
    if (thumbnail_url) {
      videoData.thumbnail_url = thumbnail_url;
    }

    console.log('✅ Video data prepared:', videoData);

    // Add video to course
    course.materials.videos.push(videoData);
    await course.save();

    res.json({
      success: true,
      message: "Video saved successfully",
      data: {
        video: videoData,
        course: {
          id: course._id,
          title: course.course_title,
          total_videos: course.materials.videos.length
        }
      }
    });

  } catch (error) {
    console.error('🚨 Save video error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: "Error saving video: " + error.message
    });
  }
};

// Upload document to course - FIXED VERSION
const uploadDocumentToCourse = async (req, res) => {
  try {
    console.log('📤 Saving document metadata...');
    console.log('📦 Document request body:', JSON.stringify(req.body, null, 2));
    
    const { course_id } = req.params;
    const { title, description, cloudinary_url, cloudinary_public_id, file_size, mimetype, original_name, is_public = true, document_type = 'notes', file_extension } = req.body;

    // Check required fields
    if (!cloudinary_url || !cloudinary_public_id) {
      return res.status(400).json({
        success: false,
        error: "Cloudinary URL and public_id are required"
      });
    }

    // Find course
    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    const documentData = {
      title: title || `Document ${course.materials.documents.length + 1}`,
      description: description || '',
      file_url: cloudinary_url,
      public_id: cloudinary_public_id,
      file_type: file_extension || (original_name ? original_name.split('.').pop().toLowerCase() : 'unknown'),
      file_size: parseInt(file_size), // Ensure it's a number
      mimetype: mimetype,
      original_name: original_name,
      is_public: is_public === true || is_public === 'true',
      document_type: document_type,
      upload_date: new Date()
    };

    console.log('✅ Document data prepared:', documentData);

    // Add document to course
    course.materials.documents.push(documentData);
    await course.save();

    res.json({
      success: true,
      message: "Document saved successfully",
      data: {
        document: documentData,
        course: {
          id: course._id,
          title: course.course_title,
          total_documents: course.materials.documents.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Save document error:', error);
    res.status(500).json({
      success: false,
      error: "Error saving document: " + error.message
    });
  }
};
// Get teacher's courses
const getTeacherCourses = async (req, res) => {
  try {
    const { status, category } = req.query;
    
    let query = { teacher_id: req.user.userId};
    
    if (status) query.status = status;
    if (category) query.course_category = category;

    const courses = await CourseMaterial.find(query)
      .sort({ createdAt: -1 })
      .select('-materials.videos -materials.documents');

    res.json({
      success: true,
      data: courses,
      total: courses.length
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching courses: " + error.message
    });
  }
};

// Get single course with all materials
const getCourseDetails = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Ensure Cloudinary URLs are properly formatted
    const formattedCourse = course.toObject();
    
    // Format video URLs
    formattedCourse.materials.videos = formattedCourse.materials.videos.map(video => ({
      ...video,
      video_url: formatCloudinaryUrl(video.video_url, 'video')
    }));
    
    // Format document URLs
    formattedCourse.materials.documents = formattedCourse.materials.documents.map(doc => ({
      ...doc,
      file_url: formatCloudinaryUrl(doc.file_url, 'raw')
    }));

    res.json({
      success: true,
      data: formattedCourse
    });

  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching course details: " + error.message
    });
  }
};

// Helper function to format Cloudinary URLs
const formatCloudinaryUrl = (url, resourceType) => {
  if (!url) return null;
  
  // If it's already a proper Cloudinary URL, return as-is
  if (url.includes('res.cloudinary.com')) {
    return url;
  }
  
  // If it's a Cloudinary public_id
  if (url.includes('cloudinary.com')) {
    try {
      const cloudName = 'dpsssv5tg'; // Your Cloudinary cloud name
      const folder = resourceType === 'video' ? 'video/upload' : 'raw/upload';
      
      // Extract public_id from URL
      const parts = url.split('/');
      const publicId = parts[parts.length - 1];
      
      return `https://res.cloudinary.com/${cloudName}/${folder}/${publicId}`;
    } catch (error) {
      console.error('Error formatting Cloudinary URL:', error);
      return url;
    }
  }
  
  // For relative URLs, make them absolute
  if (url.startsWith('/')) {
    return `https://edulearnbackend-ffiv.onrender.com${url}`;
  }
  
  return url;
};

// Update course status (publish/draft/archive)
const updateCourseStatus = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
      });
    }

    const course = await CourseMaterial.findOneAndUpdate(
      { _id: course_id, teacher_id: req.user.userId},
      { status },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    res.json({
      success: true,
      message: `Course ${status} successfully`,
      data: course
    });

  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating course status: " + error.message
    });
  }
};

// Update course basic info
const updateCourseInfo = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { course_title, course_description, course_category, course_settings, tags } = req.body;

    const course = await CourseMaterial.findOneAndUpdate(
      { _id: course_id,teacher_id: req.user.userId, },
      {
        course_title,
        course_description,
        course_category,
        course_settings,
        tags
      },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course
    });

  } catch (error) {
    console.error('Update course info error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating course: " + error.message
    });
  }
};

// Delete course material
const deleteCourseMaterial = async (req, res) => {
  try {
    const { course_id, material_type, material_id } = req.params;

    if (!['videos', 'documents'].includes(material_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid material type"
      });
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Find the material
    const materialArray = course.materials[material_type];
    const materialIndex = materialArray.findIndex(item => item._id.toString() === material_id);

    if (materialIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Material not found"
      });
    }

    const material = materialArray[materialIndex];
    
    // Delete from Cloudinary if public_id exists
    if (material.public_id) {
      const resourceType = material_type === 'videos' ? 'video' : 'raw';
      await deleteFile(material.public_id, resourceType);
    }

    // Remove from array
    materialArray.splice(materialIndex, 1);
    await course.save();

    res.json({
      success: true,
      message: "Material deleted successfully"
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      error: "Error deleting material: " + error.message
    });
  }
};

// Reorder videos
const reorderVideos = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { video_order } = req.body; // Array of { video_id, order }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Update video orders
    video_order.forEach(({ video_id, order }) => {
      const video = course.materials.videos.id(video_id);
      if (video) {
        video.video_order = order;
      }
    });

    await course.save();

    res.json({
      success: true,
      message: "Videos reordered successfully"
    });

  } catch (error) {
    console.error('Reorder videos error:', error);
    res.status(500).json({
      success: false,
      error: "Error reordering videos: " + error.message
    });
  }
};

// Get course materials (videos & documents)
const getCourseMaterials = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    }).select('materials course_title');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Format URLs for Cloudinary
    const videos = course.materials.videos.map(video => ({
      ...video.toObject(),
      video_url: formatCloudinaryUrl(video.video_url, 'video')
    }));

    const documents = course.materials.documents.map(doc => ({
      ...doc.toObject(),
      file_url: formatCloudinaryUrl(doc.file_url, 'raw')
    }));

    res.json({
      success: true,
      data: {
        course_title: course.course_title,
        videos: videos,
        documents: documents
      }
    });

  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching course materials: " + error.message
    });
  }
};

// Update video info
const updateVideoInfo = async (req, res) => {
  try {
    const { course_id, video_id } = req.params;
    const { title, description, is_public, video_order } = req.body;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    const video = course.materials.videos.id(video_id);
    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found"
      });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (is_public !== undefined) video.is_public = is_public;
    if (video_order !== undefined) video.video_order = video_order;

    await course.save();

    res.json({
      success: true,
      message: "Video updated successfully",
      data: video
    });

  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating video: " + error.message
    });
  }
};

// Update document info
const updateDocumentInfo = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;
    const { title, description, is_public, document_type } = req.body;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    const document = course.materials.documents.id(document_id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found"
      });
    }

    if (title) document.title = title;
    if (description) document.description = description;
    if (is_public !== undefined) document.is_public = is_public;
    if (document_type) document.document_type = document_type;

    await course.save();

    res.json({
      success: true,
      message: "Document updated successfully",
      data: document
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating document: " + error.message
    });
  }
};

// Add meeting to course
const addMeetingToCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const {
      title,
      description,
      meeting_url,
      meeting_type,
      scheduled_date,
      duration,
      is_recurring,
      recurrence_pattern,
      meeting_id,
      passcode,
      status
    } = req.body;

    if (!title || !meeting_url || !scheduled_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, meeting URL, and scheduled date are required'
      });
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const newMeeting = {
      title,
      description: description || '',
      meeting_url,
      meeting_type: meeting_type || 'other',
      scheduled_date: new Date(scheduled_date),
      duration: duration || 60,
      is_recurring: is_recurring || false,
      recurrence_pattern: recurrence_pattern || 'none',
      meeting_id: meeting_id || '',
      passcode: passcode || '',
      status: status || 'scheduled',
      meeting_order: course.materials.meetings.length
    };

    course.materials.meetings.push(newMeeting);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Meeting added successfully',
      meeting: newMeeting
    });

  } catch (error) {
    console.error('Add meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update meeting information
const updateMeetingInfo = async (req, res) => {
  try {
    const { course_id, meeting_id } = req.params;
    const updateData = req.body;

    if (updateData.scheduled_date) {
      updateData.scheduled_date = new Date(updateData.scheduled_date);
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const meeting = course.materials.meetings.id(meeting_id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        meeting[key] = updateData[key];
      }
    });

    await course.save();

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get meetings for a course
const getCourseMeetings = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { status, upcoming } = req.query;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    let meetings = course.materials.meetings;

    // Filter by status if provided
    if (status) {
      meetings = meetings.filter(meeting => meeting.status === status);
    }

    // Filter upcoming meetings if requested
    if (upcoming === 'true') {
      const now = new Date();
      meetings = meetings.filter(meeting => 
        new Date(meeting.scheduled_date) > now && meeting.status === 'scheduled'
      );
    }

    // Sort by scheduled date
    meetings.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

    res.json({
      success: true,
      meetings,
      total: meetings.length
    });

  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const { course_id, meeting_id } = req.params;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const meetingIndex = course.materials.meetings.findIndex(
      meeting => meeting._id.toString() === meeting_id
    );

    if (meetingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    course.materials.meetings.splice(meetingIndex, 1);
    
    // Reorder remaining meetings
    course.materials.meetings.forEach((meeting, index) => {
      meeting.meeting_order = index;
    });

    await course.save();

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reorder meetings
const reorderMeetings = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { meetingOrder } = req.body;

    if (!meetingOrder || !Array.isArray(meetingOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Meeting order array is required'
      });
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Update meeting orders
    meetingOrder.forEach((meetingId, newOrder) => {
      const meeting = course.materials.meetings.id(meetingId);
      if (meeting) {
        meeting.meeting_order = newOrder;
      }
    });

    await course.save();

    res.json({
      success: true,
      message: 'Meetings reordered successfully'
    });

  } catch (error) {
    console.error('Reorder meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createCourse,
  uploadVideoToCourse,
  uploadDocumentToCourse,
  getTeacherCourses,
  getCourseDetails,
  updateCourseStatus,
  updateCourseInfo,
  deleteCourseMaterial,
  reorderVideos,
  getCourseMaterials,
  updateVideoInfo,
  updateDocumentInfo,
  addMeetingToCourse,
  updateMeetingInfo,
  getCourseMeetings,
  deleteMeeting,
  reorderMeetings
};