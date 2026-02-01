const StudentEnrollment = require('../models/Mylearningmodel');
const CourseMaterial = require('../models/courseMaterialdata');

// Helper function to get display names for categories

// Add this helper function at the top of Mylearningcontroller.js
const formatCloudinaryUrlForStudent = (url, fileType) => {
  if (!url) return null;
  
  console.log('Formatting URL:', url, 'Type:', fileType);
  
  // If it's already a proper Cloudinary URL, return as-is
  if (url.includes('res.cloudinary.com')) {
    // Check if it's in the right format for viewing
    const cloudName = 'dpsssv5tg'; // Your Cloudinary cloud name
    
    // For PDFs: ensure they're viewable
    if (fileType === 'pdf' && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment.name:document/');
    }
    
    return url;
  }
  
  // If it's a Cloudinary public_id format
  if (url.includes('cloudinary.com')) {
    try {
      const parts = url.split('/');
      const publicId = parts[parts.length - 1];
      const resourceType = fileType === 'pdf' ? 'image' : 
                          ['jpg', 'jpeg', 'png', 'gif'].includes(fileType) ? 'image' : 'raw';
      
      return `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${publicId}`;
    } catch (error) {
      console.error('Error formatting Cloudinary URL:', error);
      return url;
    }
  }
  
  // For old upload URLs, return null (students can't access these)
  if (url.startsWith('/uploads/')) {
    console.warn('Old upload URL found:', url);
    return null;
  }
  
  // For relative URLs, make absolute
  if (url.startsWith('/')) {
    return `https://edulearnbackend-ffiv.onrender.com${url}`;
  }
  
  return url;
};


const getCategoryDisplayName = (category) => {
  const categoryMap = {
    'web-development': 'Web Development',
    'microsoft-office': 'Microsoft Office',
    'c-programming': 'C Programming',
    'java': 'java',
    'php':'php',
    'dbms':'DBMS',
    'digital-marketing': 'Digital Marketing',
    'tally':'Tally',
    'microsoft-word':'Microsoft Word',
    'microsoft-excel':'Microsoft Excel',
    'microsoft-powerpoint': 'Microsoft PowerPoint',
    'python': 'Python',
    'email-internet': 'Email & Internet',
    'canva': 'Canva',
  };
  return categoryMap[category] || category;
};

// Get student's enrolled courses with materials
const getMyLearningCourses = async (req, res) => {
  try {
    const student_email = req.user.email;
    
    console.log('🟡 Fetching enrollments for:', student_email);
    
    // Get student's enrollments
    const enrollments = await StudentEnrollment.find({ 
      student_email, 
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    console.log('🟡 Found enrollments:', enrollments.length);
    console.log('🟡 Enrollment categories:', enrollments.map(e => e.course_category));

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    // Get all course materials for enrolled course categories
    const enrolledCategories = enrollments.map(e => e.course_category);
    
    console.log('🟡 Searching for materials in categories:', enrolledCategories);

    // REMOVE status filter or make it optional
    const courseMaterials = await CourseMaterial.find({
      course_category: { $in: enrolledCategories },
      // Remove strict status filtering
      $or: [
        { status: 'published' },
        { status: 'draft' } // Include draft courses too
      ]
    })
    .populate('teacher_id', 'name email qualification')
    .select('course_title course_description course_category materials teacher_id course_settings status createdAt')
    .sort({ createdAt: -1 });

    console.log('🟡 Found course materials:', courseMaterials.length);
    console.log('🟡 Course materials statuses:', courseMaterials.map(c => ({ title: c.course_title, status: c.status })));

    // Group materials by course category
    const learningData = enrolledCategories.map(category => {
      const categoryMaterials = courseMaterials.filter(course => course.course_category === category);
      const enrollment = enrollments.find(e => e.course_category === category);
      
      console.log(`🟡 Category ${category}: ${categoryMaterials.length} materials`);

      // Calculate total materials count (include all materials regardless of status)
      const totalVideos = categoryMaterials.flatMap(course => 
        course.materials.videos.filter(v => v.is_public !== false) // Include if not explicitly false
      ).length;
      
      const totalDocuments = categoryMaterials.flatMap(course => 
        course.materials.documents.filter(d => d.is_public !== false)
      ).length;
      
      const totalMeetings = categoryMaterials.flatMap(course => 
        course.materials.meetings.filter(m => m.status === 'scheduled')
      ).length;

      return {
        course_category: category,
        category_name: getCategoryDisplayName(category),
        enrollment_date: enrollment.enrollment_date,
        progress: enrollment.progress,
        materials: {
          videos: categoryMaterials.flatMap(course => 
            course.materials.videos.filter(video => video.is_public !== false).map(video => ({
              _id: video._id,
              title: video.title,
              description: video.description,
              video_url: formatCloudinaryUrlForStudent(video.video_url, 'mp4'),
            isAvailable: !!formatCloudinaryUrlForStudent(video.video_url, 'mp4'),
              duration: video.duration,
              file_size: video.file_size,
              is_public: video.is_public,
              upload_date: video.upload_date,
              course_title: course.course_title,
              teacher_name: course.teacher_id?.name || 'Unknown Teacher',
              teacher_qualification: course.teacher_id?.qualification || '',
              course_id: course._id,
              course_status: course.status // Add course status for debugging
            }))
          ),
          documents: categoryMaterials.flatMap(course => 
            course.materials.documents.filter(doc => doc.is_public !== false).map(doc => ({
              _id: doc._id,
              title: doc.title,
              description: doc.description,
              file_url: formatCloudinaryUrlForStudent(doc.file_url, doc.file_type),
            isAvailable: !!formatCloudinaryUrlForStudent(doc.file_url, doc.file_type),
              file_type: doc.file_type,
              file_size: doc.file_size,
              document_type: doc.document_type,
              is_public: doc.is_public,
              upload_date: doc.upload_date,
              course_title: course.course_title,
              teacher_name: course.teacher_id?.name || 'Unknown Teacher',
              teacher_qualification: course.teacher_id?.qualification || '',
              course_id: course._id,
              course_status: course.status
            }))
          ),
          meetings: categoryMaterials.flatMap(course => 
            course.materials.meetings.filter(meeting => meeting.status === 'scheduled').map(meeting => ({
              _id: meeting._id,
              title: meeting.title,
              description: meeting.description,
              meeting_url: meeting.meeting_url,
              meeting_type: meeting.meeting_type,
              scheduled_date: meeting.scheduled_date,
              duration: meeting.duration,
              meeting_id: meeting.meeting_id,
              passcode: meeting.passcode,
              status: meeting.status,
              course_title: course.course_title,
              teacher_name: course.teacher_id?.name || 'Unknown Teacher',
              teacher_qualification: course.teacher_id?.qualification || '',
              course_id: course._id,
              course_status: course.status
            }))
          )
        },
        teachers: [...new Set(categoryMaterials.map(course => 
          course.teacher_id?.name || 'Unknown Teacher'
        ))],
        total_courses: categoryMaterials.length,
        total_materials: {
          videos: totalVideos,
          documents: totalDocuments,
          meetings: totalMeetings,
          all: totalVideos + totalDocuments + totalMeetings
        }
      };
    });

    console.log('🟡 Final learning data:', learningData.map(cat => ({
      category: cat.course_category,
      videos: cat.materials.videos.length,
      documents: cat.materials.documents.length,
      meetings: cat.materials.meetings.length
    })));

    res.json({
      success: true,
      data: learningData
    });

  } catch (error) {
    console.error('🔴 Get my learning courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching learning materials: ' + error.message
    });
  }
};
// Get materials for specific course category
const getCategoryMaterials = async (req, res) => {
  try {
    const { category } = req.params;
    const student_email = req.user.email;

    // Check if student is enrolled in this category
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course category'
      });
    }

    // Get all course materials for this category
    const courseMaterials = await CourseMaterial.find({
      course_category: category,
      status: 'published',
      'course_settings.is_published': true
    })
    .populate('teacher_id', 'name email qualification years_of_experience specialization')
    .select('course_title course_description course_category materials teacher_id createdAt')
    .sort({ createdAt: -1 });

    // Organize materials by course
    const materialsByCourse = courseMaterials.map(course => ({
      course_id: course._id,
      course_title: course.course_title,
      course_description: course.course_description,
      teacher_name: course.teacher_id?.name || 'Unknown Teacher',
      teacher_email: course.teacher_id?.email,
      teacher_qualification: course.teacher_id?.qualification,
      teacher_experience: course.teacher_id?.years_of_experience,
      teacher_specialization: course.teacher_id?.specialization || [],
      created_date: course.createdAt,
      materials: {
        videos: course.materials.videos.filter(video => video.is_public),
        documents: course.materials.documents.filter(doc => doc.is_public),
        meetings: course.materials.meetings.filter(meeting => meeting.status === 'scheduled')
      }
    }));

    // Update last accessed
    enrollment.progress.last_accessed = new Date();
    await enrollment.save();

    res.json({
      success: true,
      data: {
        category,
        category_name: getCategoryDisplayName(category),
        enrollment_date: enrollment.enrollment_date,
        progress: enrollment.progress,
        courses: materialsByCourse,
        total_courses: materialsByCourse.length,
        total_teachers: [...new Set(materialsByCourse.map(course => course.teacher_name))].length
      }
    });

  } catch (error) {
    console.error('Get category materials error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching category materials: ' + error.message
    });
  }
};

// Mark material as completed
const markMaterialCompleted = async (req, res) => {
  try {
    const { category, material_type, material_id } = req.params;
    const student_email = req.user.email;

    // Check enrollment
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: category,
      payment_status: 'verified'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course category'
      });
    }

    // Add to completed materials based on type
    const completedEntry = {
      [material_type === 'videos' ? 'video_id' : 
       material_type === 'documents' ? 'document_id' : 'meeting_id']: material_id,
      completed_at: new Date()
    };

    if (material_type === 'videos') {
      // Check if already completed
      if (!enrollment.progress.completed_videos.some(v => v.video_id.toString() === material_id)) {
        enrollment.progress.completed_videos.push(completedEntry);
      }
    } else if (material_type === 'documents') {
      if (!enrollment.progress.completed_documents.some(d => d.document_id.toString() === material_id)) {
        enrollment.progress.completed_documents.push(completedEntry);
      }
    } else if (material_type === 'meetings') {
      if (!enrollment.progress.completed_meetings.some(m => m.meeting_id.toString() === material_id)) {
        enrollment.progress.completed_meetings.push(completedEntry);
      }
    }

    // Update overall progress
    enrollment.updateProgress();
    await enrollment.save();

    res.json({
      success: true,
      message: `${material_type.slice(0, -1)} marked as completed`,
      progress: enrollment.progress
    });

  } catch (error) {
    console.error('Mark material completed error:', error);
    res.status(500).json({
      success: false,
      error: 'Error marking material as completed: ' + error.message
    });
  }
};

// Get learning progress
const getLearningProgress = async (req, res) => {
  try {
    const student_email = req.user.email;

    const enrollments = await StudentEnrollment.find({
      student_email,
      payment_status: 'verified'
    });

    const progressData = enrollments.map(enrollment => ({
      course_category: enrollment.course_category,
      category_name: getCategoryDisplayName(enrollment.course_category),
      enrollment_date: enrollment.enrollment_date,
      progress: enrollment.progress,
      completed_materials: {
        videos: enrollment.progress.completed_videos.length,
        documents: enrollment.progress.completed_documents.length,
        meetings: enrollment.progress.completed_meetings.length
      }
    }));

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Get learning progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching learning progress: ' + error.message
    });
  }
};
// Add to Mylearningcontroller.js
const debugStudentData = async (req, res) => {
  try {
    const student_email = req.user.email;
    
    const enrollments = await StudentEnrollment.find({ 
      student_email, 
      payment_status: 'verified'
    });

    const courseMaterials = await CourseMaterial.find({});
    
    res.json({
      success: true,
      debug: {
        student_email,
        enrollments: enrollments.map(e => ({
          category: e.course_category,
          status: e.payment_status
        })),
        all_courses: courseMaterials.map(c => ({
          title: c.course_title,
          category: c.course_category,
          status: c.status,
          videos: c.materials.videos.length,
          documents: c.materials.documents.length
        }))
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



module.exports = {
  getMyLearningCourses,
  getCategoryMaterials,
  markMaterialCompleted,
  getLearningProgress,
  debugStudentData
};