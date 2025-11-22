const MyCourseMaterial = require('../models/Mycoursemodel');

// Get all courses for a teacher with material counts
const getMyCourses = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = { teacher_id: req.user.userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.course_category = category;
    }

    const courses = await MyCourseMaterial.find(query)
      .select('course_title course_description course_category status created_at updated_at total_views total_students average_rating')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get material counts for each course - FIXED: Use MyCourseMaterial
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const materialCounts = await MyCourseMaterial.aggregate([ // FIXED: Changed from CourseMaterial to MyCourseMaterial
          { $match: { _id: course._id } },
          {
            $project: {
              total_videos: { $size: "$materials.videos" },
              total_documents: { $size: "$materials.documents" },
              total_notes: {
                $size: {
                  $filter: {
                    input: "$materials.documents",
                    as: "doc",
                    cond: { $eq: ["$$doc.document_type", "notes"] }
                  }
                }
              },
              total_assignments: {
                $size: {
                  $filter: {
                    input: "$materials.documents",
                    as: "doc",
                    cond: { $eq: ["$$doc.document_type", "assignment"] }
                  }
                }
              },
              total_slides: {
                $size: {
                  $filter: {
                    input: "$materials.documents",
                    as: "doc",
                    cond: { $eq: ["$$doc.document_type", "slides"] }
                  }
                }
              },
              total_resources: {
                $size: {
                  $filter: {
                    input: "$materials.documents",
                    as: "doc",
                    cond: { $eq: ["$$doc.document_type", "resource"] }
                  }
                }
              }
            }
          }
        ]);

        return {
          ...course.toObject(),
          material_counts: materialCounts[0] || {
            total_videos: 0,
            total_documents: 0,
            total_notes: 0,
            total_assignments: 0,
            total_slides: 0,
            total_resources: 0
          }
        };
      })
    );

    const total = await MyCourseMaterial.countDocuments(query);

    res.json({
      success: true,
      data: coursesWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCourses: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching courses: " + error.message
    });
  }
};

// Get single course with all materials organized
const getCourseWithMaterials = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await MyCourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Organize materials by type
    const organizedMaterials = {
      videos: course.materials.videos.sort((a, b) => a.video_order - b.video_order),
      documents: {
        all: course.materials.documents,
        notes: course.materials.documents.filter(doc => doc.document_type === 'notes'),
        assignments: course.materials.documents.filter(doc => doc.document_type === 'assignment'),
        slides: course.materials.documents.filter(doc => doc.document_type === 'slides'),
        resources: course.materials.documents.filter(doc => doc.document_type === 'resource'),
        other: course.materials.documents.filter(doc => doc.document_type === 'other')
      }
    };

    const courseResponse = {
      ...course.toObject(),
      materials: organizedMaterials,
      material_counts: {
        total_videos: organizedMaterials.videos.length,
        total_documents: organizedMaterials.documents.all.length,
        total_notes: organizedMaterials.documents.notes.length,
        total_assignments: organizedMaterials.documents.assignments.length,
        total_slides: organizedMaterials.documents.slides.length,
        total_resources: organizedMaterials.documents.resources.length,
        total_other: organizedMaterials.documents.other.length
      }
    };

    res.json({
      success: true,
      data: courseResponse
    });

  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching course materials: " + error.message
    });
  }
};

// Get materials by type for a course
const getCourseMaterialsByType = async (req, res) => {
  try {
    const { course_id, material_type } = req.params;
    const { document_type, page = 1, limit = 20 } = req.query;

    const course = await MyCourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    }).select('course_title materials');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    let materials = [];
    let total = 0;

    if (material_type === 'videos') {
      materials = course.materials.videos
        .sort((a, b) => a.video_order - b.video_order)
        .slice((page - 1) * limit, page * limit);
      total = course.materials.videos.length;
    } 
    else if (material_type === 'documents') {
      let filteredDocuments = course.materials.documents;
      
      if (document_type && document_type !== 'all') {
        filteredDocuments = filteredDocuments.filter(doc => doc.document_type === document_type);
      }
      
      materials = filteredDocuments
        .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
        .slice((page - 1) * limit, page * limit);
      total = filteredDocuments.length;
    } 
    else {
      return res.status(400).json({
        success: false,
        error: "Invalid material type. Use 'videos' or 'documents'"
      });
    }

    res.json({
      success: true,
      data: {
        course_title: course.course_title,
        material_type,
        document_type: document_type || 'all',
        materials,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMaterials: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get materials by type error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching materials: " + error.message
    });
  }
};

// Get course statistics for dashboard
const getCourseStatistics = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const stats = await MyCourseMaterial.aggregate([
      { $match: { teacher_id: teacherId } },
      {
        $group: {
          _id: null,
          total_courses: { $sum: 1 },
          published_courses: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] }
          },
          draft_courses: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
          },
          archived_courses: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] }
          },
          total_videos: { $sum: { $size: "$materials.videos" } },
          total_documents: { $sum: { $size: "$materials.documents" } },
          total_views: { $sum: "$total_views" },
          total_students: { $sum: "$total_students" }
        }
      }
    ]);

    // Category-wise course count
    const categoryStats = await MyCourseMaterial.aggregate([
      { $match: { teacher_id: teacherId } },
      {
        $group: {
          _id: "$course_category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const defaultStats = {
      total_courses: 0,
      published_courses: 0,
      draft_courses: 0,
      archived_courses: 0,
      total_videos: 0,
      total_documents: 0,
      total_views: 0,
      total_students: 0
    };

    res.json({
      success: true,
      data: {
        overview: stats[0] || defaultStats,
        by_category: categoryStats
      }
    });

  } catch (error) {
    console.error('Get course statistics error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching course statistics: " + error.message
    });
  }
};

// Delete course (soft delete by archiving)
const deleteCourse = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await MyCourseMaterial.findOneAndUpdate(
      { 
        _id: course_id, 
        teacher_id: req.user.userId 
      },
      { status: 'archived' },
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
      message: "Course archived successfully",
      data: course
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      error: "Error archiving course: " + error.message
    });
  }
};

module.exports = {
  getMyCourses,
  getCourseWithMaterials,
  getCourseMaterialsByType,
  getCourseStatistics,
  deleteCourse
};