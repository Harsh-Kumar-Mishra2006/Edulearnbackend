const StudentEnrollment = require('../models/Mylearningmodel');
const CourseMaterial = require('../models/courseMaterialdata');

// Helper function to get display names for categories

// Add this helper function at the top of Mylearningcontroller.js
const formatCloudinaryUrlForStudent = (url, fileType, publicId) => {
  console.log('🔗 Formatting URL:', { url, fileType, publicId });
  
  // If we have a proper Cloudinary URL, return it
  if (url && url.includes('res.cloudinary.com')) {
    console.log('✅ Already proper Cloudinary URL');
    return url;
  }
  
  // If we have a public_id but no URL, construct one
  if (publicId && !url) {
    console.log('🔧 Constructing URL from public_id:', publicId);
    const cloudName = 'dpsssv5tg';
    
    // Determine resource type
    let resourceType = 'raw';
    if (fileType === 'pdf') {
      resourceType = 'image';
    } else if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(fileType)) {
      resourceType = 'video';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      resourceType = 'image';
    }
    
    // Construct URL
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
    console.log('📤 Constructed URL:', cloudinaryUrl);
    return cloudinaryUrl;
  }
  
  // If we have a URL but it's weird, try to fix it
  if (url && url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    console.log('🔄 Fixing Cloudinary URL');
    return url.replace('cloudinary.com', 'res.cloudinary.com');
  }
  
  console.log('❌ No usable URL or public_id');
  return null;
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
// Get student's enrolled courses with materials - FIXED VERSION
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
    console.log('🟡 Enrollment categories (slugs):', enrollments.map(e => e.course_category));

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    // 🔥 CRITICAL FIX: Convert slug to display name for database query
    const slugToDisplayName = (slug) => {
  const mapping = {
    'web-development': 'Web Development',
    'microsoft-office': 'Microsoft Office',
    'c-programming': 'C Programming',
    'java': 'Java',                    // ← Capital J
    'php': 'PHP',                      // ← Uppercase PHP
    'dbms': 'DBMS',
    'digital-marketing': 'Digital Marketing',
    'marketing': 'Digital Marketing',
    'tally': 'Tally',
    'microsoft-word': 'Microsoft Word',
    'microsoft-excel': 'Microsoft Excel',
    'microsoft-powerpoint': 'Microsoft PowerPoint',
    'python': 'Python',                // ← Capital P
    'email-internet': 'Email & Internet',
    'canva': 'Canva',
    'design': 'Design',                // ← Add this if you have design courses
    'mobile-dev': 'Mobile Development', // ← Add this if you have mobile courses
    'graphic-design': 'Graphic Design',
    'ui-ux': 'UI/UX Design',
    'data-science': 'Data Science',
    'machine-learning': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'cloud-computing': 'Cloud Computing',
    'devops': 'DevOps',
    'cybersecurity': 'Cyber Security',
    'blockchain': 'Blockchain',
    'game-development': 'Game Development',
    'app-development': 'App Development',
    'ios': 'iOS Development',
    'android': 'Android Development',
    'flutter': 'Flutter',
    'react-native': 'React Native',
    'mern': 'MERN Stack',
    'mean': 'MEAN Stack',
    'full-stack': 'Full Stack Development',
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'database': 'Database Management',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'oracle': 'Oracle',
    'aws': 'AWS',
    'azure': 'Azure',
    'gcp': 'Google Cloud',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'jenkins': 'Jenkins',
    'git': 'Git & GitHub',
    'agile': 'Agile Methodology',
    'scrum': 'Scrum',
    'project-management': 'Project Management',
    'business-analytics': 'Business Analytics',
    'data-analytics': 'Data Analytics',
    'excel': 'Advanced Excel',
    'power-bi': 'Power BI',
    'tableau': 'Tableau',
    'salesforce': 'Salesforce',
    'sap': 'SAP',
    'erp': 'ERP Systems',
    'crm': 'CRM Software',
    'hr-management': 'HR Management',
    'finance': 'Finance Management',
    'accounting': 'Accounting',
    'taxation': 'Taxation',
    'audit': 'Auditing',
    'leadership': 'Leadership Skills',
    'communication': 'Communication Skills',
    'soft-skills': 'Soft Skills',
    'personality-development': 'Personality Development',
    'interview-preparation': 'Interview Preparation',
    'resume-writing': 'Resume Writing',
    'career-guidance': 'Career Guidance',
    'entrepreneurship': 'Entrepreneurship',
    'business-management': 'Business Management',
    'marketing-strategy': 'Marketing Strategy',
    'social-media-marketing': 'Social Media Marketing',
    'seo': 'SEO',
    'content-marketing': 'Content Marketing',
    'email-marketing': 'Email Marketing',
    'affiliate-marketing': 'Affiliate Marketing',
    'ecommerce': 'E-commerce',
    'dropshipping': 'Dropshipping',
    'amazon-fba': 'Amazon FBA',
    'shopify': 'Shopify',
    'wordpress': 'WordPress',
    'woocommerce': 'WooCommerce',
    'magento': 'Magento',
    'prestashop': 'PrestaShop',
    'joomla': 'Joomla',
    'drupal': 'Drupal',
    'laravel': 'Laravel',
    'codeigniter': 'CodeIgniter',
    'symfony': 'Symfony',
    'django': 'Django',
    'flask': 'Flask',
    'fastapi': 'FastAPI',
    'spring-boot': 'Spring Boot',
    'asp-net': 'ASP.NET',
    'csharp': 'C#',
    'cpp': 'C++',
    'c': 'C Language',
    'rust': 'Rust',
    'go': 'Go Language',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'html': 'HTML',
    'css': 'CSS',
    'sass': 'SASS',
    'bootstrap': 'Bootstrap',
    'tailwind': 'Tailwind CSS',
    'material-ui': 'Material UI',
    'react': 'React.js',
    'vue': 'Vue.js',
    'angular': 'Angular',
    'nextjs': 'Next.js',
    'nuxtjs': 'Nuxt.js',
    'gatsby': 'Gatsby',
    'nodejs': 'Node.js',
    'express': 'Express.js',
    'nestjs': 'Nest.js',
    'graphql': 'GraphQL',
    'rest-api': 'REST API',
    'socketio': 'Socket.IO',
    'web-sockets': 'Web Sockets',
    'pwa': 'Progressive Web Apps',
    'spa': 'Single Page Applications',
    'ssr': 'Server Side Rendering',
    'seo-optimization': 'SEO Optimization',
    'web-performance': 'Web Performance',
    'web-security': 'Web Security',
    'penetration-testing': 'Penetration Testing',
    'ethical-hacking': 'Ethical Hacking',
    'network-security': 'Network Security',
    'information-security': 'Information Security',
    'compliance': 'Compliance',
    'gdpr': 'GDPR',
    'hipaa': 'HIPAA',
    'pci-dss': 'PCI DSS',
    'iso': 'ISO Standards',
    'itil': 'ITIL',
    'cobit': 'COBIT',
    'togaf': 'TOGAF',
    'archimate': 'ArchiMate',
    'uml': 'UML',
    'bpmn': 'BPMN',
    'business-process': 'Business Process Management',
    'six-sigma': 'Six Sigma',
    'lean': 'Lean Management',
    'kaizen': 'Kaizen',
    '5s': '5S Methodology',
    'total-quality-management': 'Total Quality Management',
    'supply-chain': 'Supply Chain Management',
    'logistics': 'Logistics Management',
    'inventory-management': 'Inventory Management',
    'warehouse-management': 'Warehouse Management',
    'transportation': 'Transportation Management',
    'procurement': 'Procurement Management',
    'vendor-management': 'Vendor Management',
    'contract-management': 'Contract Management',
    'legal-compliance': 'Legal Compliance',
    'corporate-law': 'Corporate Law',
    'intellectual-property': 'Intellectual Property',
    'patent': 'Patent Law',
    'trademark': 'Trademark Law',
    'copyright': 'Copyright Law',
    'data-privacy': 'Data Privacy',
    'ethics': 'Business Ethics',
    'corporate-governance': 'Corporate Governance',
    'risk-management': 'Risk Management',
    'crisis-management': 'Crisis Management',
    'business-continuity': 'Business Continuity',
    'disaster-recovery': 'Disaster Recovery',
    'incident-response': 'Incident Response',
    'forensics': 'Digital Forensics',
    'malware-analysis': 'Malware Analysis',
    'reverse-engineering': 'Reverse Engineering',
    'exploit-development': 'Exploit Development',
    'bug-bounty': 'Bug Bounty',
    'vulnerability-assessment': 'Vulnerability Assessment',
    'security-audit': 'Security Audit',
    'security-operations': 'Security Operations',
    'soc': 'SOC Operations',
    'siem': 'SIEM',
    'edr': 'EDR',
    'xdr': 'XDR',
    'soar': 'SOAR',
    'firewall': 'Firewall Management',
    'ids-ips': 'IDS/IPS',
    'vpn': 'VPN',
    'zero-trust': 'Zero Trust Architecture',
    'iam': 'Identity & Access Management',
    'pam': 'Privileged Access Management',
    'mfa': 'Multi-Factor Authentication',
    'sso': 'Single Sign-On',
    'ldap': 'LDAP',
    'active-directory': 'Active Directory',
    'azure-ad': 'Azure AD',
    'okta': 'Okta',
    'auth0': 'Auth0',
    'keycloak': 'Keycloak'
  };
  return mapping[slug] || slug;
};

    // Convert enrollment slugs to display names for query
    const enrolledDisplayNames = enrollments.map(e => slugToDisplayName(e.course_category));
    
    console.log('🟡 Converted to display names for query:', enrolledDisplayNames);

    // Get all course materials using DISPLAY NAMES
    const courseMaterials = await CourseMaterial.find({
      course_category: { $in: enrolledDisplayNames },  // ← NOW using display names!
      $or: [
        { status: 'published' },
        { status: 'draft' }
      ]
    })
    .populate('teacher_id', 'name email qualification')
    .select('course_title course_description course_category materials teacher_id course_settings status createdAt')
    .sort({ createdAt: -1 });

    console.log('🟡 Found course materials:', courseMaterials.length);
    console.log('🟡 Categories found in materials:', [...new Set(courseMaterials.map(c => c.course_category))]);

    // Group materials by enrollment category (keep original slug for frontend)
    const learningData = enrollments.map(enrollment => {
      const enrollmentSlug = enrollment.course_category;
      const displayName = slugToDisplayName(enrollmentSlug);
      
      // Find materials that match the display name
      const categoryMaterials = courseMaterials.filter(course => course.course_category === displayName);
      
      console.log(`🟡 Category ${enrollmentSlug} (${displayName}): ${categoryMaterials.length} courses found`);

      // Calculate total materials count
      const totalVideos = categoryMaterials.flatMap(course => 
        course.materials.videos.filter(v => v.is_public !== false)
      ).length;
      
      const totalDocuments = categoryMaterials.flatMap(course => 
        course.materials.documents.filter(d => d.is_public !== false)
      ).length;
      
      const totalMeetings = categoryMaterials.flatMap(course => 
        course.materials.meetings.filter(m => m.status === 'scheduled')
      ).length;

      return {
        course_category: enrollmentSlug,  // Keep slug for frontend consistency
        category_name: getCategoryDisplayName(enrollmentSlug),
        enrollment_date: enrollment.enrollment_date,
        progress: enrollment.progress,
        materials: {
          videos: categoryMaterials.flatMap(course => 
            course.materials.videos.filter(video => video.is_public !== false).map(video => ({
              _id: video._id,
              title: video.title,
              description: video.description,
              video_url: formatCloudinaryUrlForStudent(video.video_url, 'mp4', video.public_id),
              public_id: video.public_id,
              isAvailable: !!formatCloudinaryUrlForStudent(video.video_url, 'mp4', video.public_id),
              duration: video.duration,
              file_size: video.file_size,
              is_public: video.is_public,
              upload_date: video.upload_date,
              course_title: course.course_title,
              teacher_name: course.teacher_id?.name || 'Unknown Teacher',
              teacher_qualification: course.teacher_id?.qualification || '',
              course_id: course._id.toString(),
              course_status: course.status
            }))
          ),
          documents: categoryMaterials.flatMap(course => 
            course.materials.documents.filter(doc => doc.is_public !== false).map(doc => ({
              _id: doc._id,
              title: doc.title,
              description: doc.description,
              file_url: doc.file_url,
              download_url: `/api/documents/courses/${course._id}/documents/${doc._id}/download`,
              view_url: doc.file_url,
              file_type: doc.file_type,
              file_size: doc.file_size,
              document_type: doc.document_type,
              is_public: doc.is_public,
              upload_date: doc.upload_date,
              course_title: course.course_title,
              teacher_name: course.teacher_id?.name || 'Unknown Teacher',
              teacher_qualification: course.teacher_id?.qualification || '',
              course_id: course._id.toString(),
              original_filename: doc.original_filename || doc.title,
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
    
    // Convert slug to display name for query
    const displayName = slugToDisplayName(category);

    // Check if student is enrolled in this category
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category: category,  // Keep slug for enrollment check
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course category'
      });
    }

    // Get all course materials using DISPLAY NAME
    const courseMaterials = await CourseMaterial.find({
      course_category: displayName,  // ← Use display name here!
      $or: [
        { status: 'published' },
        { status: 'draft' }
      ]
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
// Add this function to your controller
const debugLearningData = async (req, res) => {
  try {
    const student_email = req.user.email;
    
    // Get enrollments
    const enrollments = await StudentEnrollment.find({ 
      student_email, 
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        message: 'No enrollments found',
        enrollments: []
      });
    }

    const enrolledCategories = enrollments.map(e => e.course_category);
    
    // Get course materials
    const courseMaterials = await CourseMaterial.find({
      course_category: { $in: enrolledCategories }
    }).populate('teacher_id', 'name email');

    // Detailed debug output
    const debugInfo = {
      student_email,
      enrollments: enrollments.map(e => ({
        category: e.course_category,
        status: e.payment_status
      })),
      courses_found: courseMaterials.length,
      courses_detail: courseMaterials.map(course => ({
        title: course.course_title,
        category: course.course_category,
        status: course.status,
        videos_count: course.materials.videos.length,
        documents_count: course.materials.documents.length,
        first_video: course.materials.videos[0] ? {
          id: course.materials.videos[0]._id,
          title: course.materials.videos[0].title,
          has_course_id: !!course._id
        } : null,
        first_document: course.materials.documents[0] ? {
          id: course.materials.documents[0]._id,
          title: course.materials.documents[0].title,
          has_course_id: !!course._id
        } : null
      }))
    };

    res.json({
      success: true,
      debug: debugInfo
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
  debugStudentData,
  debugLearningData
};