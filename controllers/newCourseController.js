// controllers/adminCourseController.js
const Course = require('../models/newCourseModel');
const { deleteCourseImage } = require('../config/newCourseImageUpload');

// Create a new course (Admin only)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      level,
      price,
      category,
      features,
      popular,
      isFree,
      discountPrice,
      prerequisites,
      learningOutcomes,
      targetAudience,
      metaTitle,
      metaDescription,
      keywords,
      isFeatured,
      status
    } = req.body;

    // Validate required fields
    if (!title || !description || !duration || !level || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, duration, level, price, category'
      });
    }

    // Check if course with same title exists
    const existingCourse = await Course.findOne({
      title: title.trim()
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: 'Course with this title already exists'
      });
    }

    // Parse features if it's a string
    let featuresArray = [];
    if (features) {
      if (typeof features === 'string') {
        featuresArray = features.split(',').map(feature => feature.trim());
      } else if (Array.isArray(features)) {
        featuresArray = features;
      }
    }

    // Parse other array fields
    const parseArrayField = (field) => {
      if (!field) return [];
      if (typeof field === 'string') {
        return field.split(',').map(item => item.trim());
      }
      return Array.isArray(field) ? field : [];
    };

    // Get image filename from upload
    const image = req.file ? req.file.filename : 'default-course.jpg';

    // Create new course
    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      image,
      duration: duration.trim(),
      level,
      price: parseFloat(price),
      category,
      features: featuresArray,
      popular: popular === 'true' || popular === true,
      
      // Admin info
      createdBy: req.admin.id,
      createdByName: req.admin.name || 'Admin',
      createdByEmail: req.user.email,
      
      // Optional fields
      isFree: isFree === 'true' || isFree === true,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      prerequisites: parseArrayField(prerequisites),
      learningOutcomes: parseArrayField(learningOutcomes),
      targetAudience: parseArrayField(targetAudience),
      metaTitle: metaTitle || title.trim(),
      metaDescription: metaDescription || description.trim().substring(0, 160),
      keywords: parseArrayField(keywords),
      isFeatured: isFeatured === 'true' || isFeatured === true,
      status: status || 'published'
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
    console.error('Create course error:', error);
    
    // Delete uploaded image if there was an error
    if (req.file) {
      deleteCourseImage(req.file.filename);
    }

    res.status(500).json({
      success: false,
      error: 'Error creating course: ' + error.message
    });
  }
};

// Get all courses (Admin view)
const getAllCourses = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      popular, 
      isFeatured, 
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (category && category !== 'All') query.category = category;
    if (popular === 'true') query.popular = true;
    if (isFeatured === 'true') query.isFeatured = true;
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Course.countDocuments(query);

    // Get paginated courses
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    res.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
};

// Get single course (Admin view)
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching course: ' + error.message
    });
  }
};

// Update course (Admin only)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateData = { ...req.body };
    
    // Handle features parsing
    if (updateData.features) {
      if (typeof updateData.features === 'string') {
        updateData.features = updateData.features.split(',').map(feature => feature.trim());
      }
    }
    
    // Handle boolean values
    const booleanFields = ['popular', 'isFree', 'isFeatured', 'isActive'];
    booleanFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === 'true' || updateData[field] === true;
      }
    });
    
    // Handle numeric values
    const numericFields = ['price', 'discountPrice', 'rating'];
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = parseFloat(updateData[field]);
      }
    });

    // Check if course exists
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if title is being changed and if new title already exists
    if (updateData.title && updateData.title.trim() !== course.title) {
      const existingCourse = await Course.findOne({
        title: updateData.title.trim(),
        _id: { $ne: id }
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          error: 'Another course with this title already exists'
        });
      }
    }

    // Handle image upload if new image is provided
    if (req.file) {
      // Delete old image if it's not the default
      if (course.image && course.image !== 'default-course.jpg') {
        deleteCourseImage(course.image);
      }
      updateData.image = req.file.filename;
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    
    // Delete uploaded image if there was an error
    if (req.file) {
      deleteCourseImage(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      error: 'Error updating course: ' + error.message
    });
  }
};

// Update course status
const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'published', 'archived', 'pending_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: draft, published, archived, or pending_review'
      });
    }

    const updateData = { status };
    
    // Add publishedAt timestamp if publishing
    if (status === 'published' && status !== 'published') {
      updateData.publishedAt = Date.now();
    }

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course
    });

  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating course status: ' + error.message
    });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Delete course image
    if (course.image && course.image !== 'default-course.jpg') {
      deleteCourseImage(course.image);
    }

    // Delete course from database
    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting course: ' + error.message
    });
  }
};

// Get course statistics
const getCourseStatistics = async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          publishedCourses: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          draftCourses: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          archivedCourses: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
          pendingCourses: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
          popularCourses: { $sum: { $cond: [{ $eq: ['$popular', true] }, 1, 0] } },
          featuredCourses: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
          freeCourses: { $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] } },
          // Revenue stats (if you have student enrollment data)
          totalRevenue: { $sum: { $multiply: ['$price', { $ifNull: ['$studentsEnrolled', 0] }] } }
        }
      }
    ]);

    const categories = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const levels = await Course.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalCourses: 0,
          publishedCourses: 0,
          draftCourses: 0,
          archivedCourses: 0,
          pendingCourses: 0,
          popularCourses: 0,
          featuredCourses: 0,
          freeCourses: 0,
          totalRevenue: 0
        },
        categories,
        levels
      }
    });

  } catch (error) {
    console.error('Get course statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching course statistics: ' + error.message
    });
  }
};

// Bulk update courses (for status, popular, featured, etc.)
const bulkUpdateCourses = async (req, res) => {
  try {
    const { courseIds, action, value } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Course IDs array is required'
      });
    }

    if (!action || !value) {
      return res.status(400).json({
        success: false,
        error: 'Action and value are required'
      });
    }

    // Validate action
    const validActions = ['status', 'popular', 'featured', 'active'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    const updateField = {
      'status': 'status',
      'popular': 'popular',
      'featured': 'isFeatured',
      'active': 'isActive'
    }[action];

    const updateData = { [updateField]: value };

    // Update multiple courses
    const result = await Course.updateMany(
      { _id: { $in: courseIds } },
      updateData,
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} courses`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Bulk update courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating courses: ' + error.message
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  getCourseStatistics,
  bulkUpdateCourses
};