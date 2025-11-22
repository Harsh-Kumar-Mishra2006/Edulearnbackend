const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const personalRoutes = require('./routes/personalRoute');
const backgroundRoutes = require('./routes/backgroundRoute');
const courseRoutes = require('./routes/courseRoute');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const connectDB = require('./config/db');
const teacherRoutes = require('./routes/teacherRoute');
const teacherManagementRoutes = require('./routes/adminaddroute');
const courseMaterialRoutes = require('./routes/courseMaterialRoute');
const myCourseRoutes = require('./routes/Mycourseroute');
const { addMeetingToCourse, getCourseMeetings } = require('./controllers/courseMaterialController');
const CertificateRoutes = require('./routes/Certificateroute');
const { issueCertificate, verifyCertificate, bulkIssueCertificates, getCertificateStats, getStudentCertificates } = require('./controllers/Certificatecontroller');
const Mylearning= require('./routes/Mylearningroute');
const { processPayment } = require('./controllers/paymentController');

// Initialize express app
const app = express();
connectDB();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Course Registration API is running!',
    endpoints: {
      personal: '/api/personal/save',
      background: '/api/background/save', 
      course: '/api/course/save',
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      payment: '/api/payment',
      getProfile: '/api/auth/profile',
      updateProfile: '/api/auth/profile',
      getStudentRecords: '/api/teacher/student-records',
      updatePaymentStatus: '/api/teacher/payment/:id/status',
      addTeacher: '/api/admin/teachers/add',
      getAllTeachers: '/api/admin/teachers/all',
      getTeacherStats: '/api/admin/teachers/stats',
      getTeacherById: '/api/admin/teachers/:id',
      updateTeacher: '/api/admin/teachers/:id',
      deleteTeachers: '/api/admin/teachers/:id',
      createCourse: '/api/course-materials/courses',
      getTeacherCourses: '/api/course-materials/courses',
      getCourseDetails: 'api/course-materials/courses/:course_id',
      updateCourseStatus: 'api/course-materials/courses/:course_id/status',
      updateCourseInfo: 'api/course-materials/courses/:course_id/info',
      reorderVideos: 'api/course-materials/courses/:course_id/reorder-videos',
      uploadVideo,uploadVideoToCourse:  'api/course-materials/courses/:course_id/videos',
      uploadVideoToCourse,uploadDocumentToCourse: 'api/course-materials/courses/:course_id/documents',
      deleteCourseMaterial: 'api/course-materials/courses/:course_id/materials/:material_type/:material_id',
      checkTeacherAuthorization: '/api/auth/check-teacher',
      getCourseMaterials: '/api/course-materials/courses/:course_id/materials',
      updateVideoInfo: '/api/course-materials/courses/:course_id/videos/:video_id',
      updateDocumentInfo: '/api/course-materials/courses/:course_id/documents/:document_id',
      // FIXED: Update these endpoints to match the correct path
      getMyCourses: '/api/teacher/my-courses/',
      getCourseStatistics: '/api/teacher/my-courses/statistics',
      getCourseWithMaterials: '/api/teacher/my-courses/:course_id',
      getCourseMaterialsByType: '/api/teacher/my-courses/:course_id/materials/:material_type',
      deleteCourse: '/api/teacher/my-courses/:course_id',
      addMeetingToCourse: '/api//courses/:course_id/meetings',
      getCourseMeetings: '/api/courses/:course_id/meetings',
      updateMeetingInfo: '/api/courses/:course_id/meetings/:meeting_id',
      deleteMeeting: '/api/courses/:course_id/meetings/:meeting_id',
      reorderMeetings: '/api/courses/:course_id/reorder-meetings',
      issueCertificate: '/api/certificates/issue',
      bulkIssueCertificates: '/api/certificates/bulk-issue',
      getAllCertificates: '/api/certificates/',
      getCertificateById: '/api/certificates/:id',
      getCertificateStats: '/api/certificates/stats',
      revokeCertificate: '/api/certificates/:id/revoke',
      getStudentCertificates: '/api/certificates/student/:student_id',
      getMyLearningCourses: '/api/my-learning/courses',
      getCategoryMaterials: '/api/my-learning/courses/:category',
      markMaterialCompleted: '/api/my-learning/progress/:category/:material_type/:material_id',
      getLearningProgress: '/api/my-learning/progress',
      processPayment: '/api/payment/process',
      verifyPayment: '/api/payment/verify/:paymentId',
      getPaymentStatus: '/api/payment/status/:student_email',
      debugStudentData: '/api/my-learning/debug'
    }
  });
});

// API routes
app.use('/api/personal', personalRoutes);
app.use('/api/background', backgroundRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', teacherManagementRoutes);
app.use('/api/course-materials', courseMaterialRoutes);
// FIXED: Changed from '/api/my-courses' to '/api/teacher/my-courses'
app.use('/api/teacher/my-courses', myCourseRoutes);
app.use('/api/certificates', CertificateRoutes);
app.use('/api/my-learning', Mylearning);

app.use('/uploads', express.static('uploads'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Course Registration Backend Active`);
  console.log(`http://localhost:${PORT}`);
});

module.exports = app;