// routes/studentCourseRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/newCourseModel');
const { studentAuth } = require('../middlewares/studentauthMiddleware');

// GET all published courses for students
router.get('/', async (req, res) => {
  try {
    console.log('📚 Student courses endpoint called');
    
    const { 
      category, 
      search,
      page = 1,
      limit = 50 
    } = req.query;

    // Build query for published courses only
    const query = { 
      status: 'published',
      isActive: true 
    };

    // Apply filters
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
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
      .select('-__v -metaTitle -metaDescription -keywords -targetAudience -updatedBy');

    // Format image URLs
    const transformedCourses = courses.map(course => ({
      id: course._id,
      title: course.title || 'Untitled Course',
      description: course.description || 'No description',
      image: course.image ? `/uploads/${course.image}` : '/default-course.jpg',
      duration: course.duration || '10 hours',
      level: course.level || 'Beginner',
      price: course.price || 0,
      category: course.category || 'General',
      features: course.features || [],
      popular: Boolean(course.popular),
      isFeatured: Boolean(course.isFeatured),
      isFree: Boolean(course.isFree),
      discountPrice: course.discountPrice,
      status: course.status,
      createdBy: course.instructor || 'Teacher',
      createdAt: course.createdAt,
      enrolledStudents: course.studentsEnrolled || 0,
      createdByRole: 'teacher',
      rating: course.rating || 0,
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || []
    }));

    res.json({
      success: true,
      data: transformedCourses,
      count: transformedCourses.length,
      total: total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error('❌ Error in student courses endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
});

// GET single course by ID for students
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({
      _id: id,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not published'
      });
    }

    // Transform course for frontend
    const transformedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      image: course.image ? `/uploads/${course.image}` : '/default-course.jpg',
      duration: course.duration,
      level: course.level,
      price: course.price,
      category: course.category,
      features: course.features,
      popular: Boolean(course.popular),
      isFeatured: Boolean(course.isFeatured),
      isFree: Boolean(course.isFree),
      discountPrice: course.discountPrice,
      status: course.status,
      createdBy: course.instructor || 'Teacher',
      createdAt: course.createdAt,
      enrolledStudents: course.studentsEnrolled || 0,
      createdByRole: 'teacher',
      rating: course.rating || 0,
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || []
    };

    res.json({
      success: true,
      data: transformedCourse
    });

  } catch (error) {
    console.error('❌ Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching course: ' + error.message
    });
  }
});

module.exports = router;