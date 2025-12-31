// controllers/publicCourseController.js
const Course = require('../models/Course');

// Get all published courses (Public access - for students)
const getPublishedCourses = async (req, res) => {
  try {
    const { 
      category, 
      popular, 
      isFeatured, 
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Only show published courses
    const query = { status: 'published', isActive: true };

    // Apply filters
    if (category && category !== 'All') query.category = category;
    if (popular === 'true') query.popular = true;
    if (isFeatured === 'true') query.isFeatured = true;
    
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

    // Transform courses for frontend
    const transformedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      image: course.image ? `/uploads/${course.image}` : '/default-course.jpg',
      duration: course.duration,
      level: course.level,
      price: course.price,
      rating: course.rating || 0,
      category: course.category,
      features: course.features || [],
      popular: Boolean(course.popular),
      isFeatured: Boolean(course.isFeatured),
      isFree: Boolean(course.isFree),
      discountPrice: course.discountPrice,
      status: course.status,
      createdBy: course.instructor || 'Teacher',
      createdAt: course.createdAt,
      enrolledStudents: course.studentsEnrolled || 0,
      createdByRole: 'teacher', // Since these are teacher-created courses
      totalLessons: course.totalLessons || 0,
      totalHours: course.totalHours || 0,
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || []
    }));

    res.json({
      success: true,
      data: transformedCourses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get published courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
};

// Get single published course
const getPublishedCourseById = async (req, res) => {
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

    const transformedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      image: course.image ? `/uploads/${course.image}` : '/default-course.jpg',
      duration: course.duration,
      level: course.level,
      price: course.price,
      rating: course.rating || 0,
      category: course.category,
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
      totalLessons: course.totalLessons || 0,
      totalHours: course.totalHours || 0,
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || [],
      targetAudience: course.targetAudience || []
    };

    res.json({
      success: true,
      data: transformedCourse
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching course: ' + error.message
    });
  }
};

module.exports = {
  getPublishedCourses,
  getPublishedCourseById
};