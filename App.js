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
const Mylearning= require('./routes/Mylearningroute');
const QuestionRoutes = require('./routes/questionRoutes');
const { downloadCertificate } = require('./controllers/Certificatecontroller');
const newCourse= require('./routes/newCourseRoute');
const emailRoutes = require('./routes/emailRoutes');
const {logger} = require('./utils/emailTemplates');
const testEmailRoute = require('./routes/testEmail');
const assignmentRoutes = require('./routes/assignmentRoutes');
const studentCourseRoutes = require('./routes/studentCourseRoutes');
// Initialize express app
const app = express();
connectDB();
const path = require('path');
const fs = require('fs');

// ✅ CORRECT: Dynamic file resolver with proper wildcard syntax
// Remove the problematic dynamic route:
// app.get('/uploads/*', (req, res) => { ... });

// Instead, use this SIMPLE approach:

// 1. Add a file download API endpoint
app.get('/api/download-file', (req, res) => {
  try {
    const { filepath } = req.query;
    
    if (!filepath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    console.log('📥 Download request for:', filepath);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Remove leading /uploads/ if present
    let relativePath = filepath;
    if (filepath.startsWith('/uploads/')) {
      relativePath = filepath.substring('/uploads/'.length);
    }
    
    // Try multiple possible locations
    let fullPath;
    
    if (isProduction) {
      // Production paths (Render)
      fullPath = path.join('/tmp', 'uploads', relativePath);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(process.cwd(), 'uploads', relativePath);
      }
      if (!fs.existsSync(fullPath)) {
        const filename = path.basename(relativePath);
        fullPath = path.join('/tmp', 'uploads', 'courses', 'documents', filename);
      }
      if (!fs.existsSync(fullPath)) {
        const filename = path.basename(relativePath);
        fullPath = path.join('/tmp', 'uploads', 'courses', 'videos', filename);
      }
    } else {
      // Local development
      fullPath = path.join(__dirname, 'uploads', relativePath);
    }
    
    console.log('🔍 Checking file at:', fullPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log('❌ File not found');
      return res.status(404).json({ 
        error: 'File not found',
        searched: fullPath
      });
    }
    
    console.log('✅ Serving file:', fullPath);
    res.download(fullPath);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Keep your static middleware for direct access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Add after importing assignmentRoutes
console.log('🔍 [APP.JS] Assignment routes imported:', assignmentRoutes ? 'YES' : 'NO');
console.log('🔍 [APP.JS] Checking assignmentRoutes object:', {
  stack: assignmentRoutes.stack ? `Has ${assignmentRoutes.stack.length} routes` : 'No stack',
  name: assignmentRoutes.name || 'No name'
});

// CORS configuration - FIXED for production + local
const allowedOrigins = [
  'http://localhost:5173',
  'https://edulearn-93zy.onrender.com'
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add these debug routes to app.js
app.get('/api/debug/auth-check', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mypassword');
    const Auth = require('./models/authdata');
    const user = await Auth.findById(decoded.id || decoded.userId || decoded._id);
    
    res.json({
      success: true,
      tokenInfo: decoded,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      } : null
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Add this to app.js
app.get('/api/debug/course-categories', async (req, res) => {
  try {
    const CourseMaterial = require('./models/courseMaterialdata');
    const courses = await CourseMaterial.find({});
    
    const categories = [...new Set(courses.map(course => course.course_category))];
    
    res.json({
      success: true,
      categories: categories,
      courses: courses.map(course => ({
        id: course._id,
        title: course.course_title,
        category: course.course_category,
        status: course.status
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this to app.js for debugging courses
app.get('/api/debug/all-courses', async (req, res) => {
  try {
    const CourseMaterial = require('./models/courseMaterialdata');
    const allCourses = await CourseMaterial.find({});
    
    console.log('📚 All courses in database:', allCourses.length);
    
    res.json({
      success: true,
      count: allCourses.length,
      courses: allCourses.map(course => ({
        id: course._id,
        title: course.course_title,
        category: course.course_category,
        status: course.status,
        hasTitle: !!course.course_title,
        hasCategory: !!course.course_category
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/debug/courses-public', async (req, res) => {
  try {
    const CourseMaterial = require('./models/courseMaterialdata');
    const courses = await CourseMaterial.find({ status: 'published' })
      .select('_id course_title course_category course_description')
      .sort({ course_title: 1 });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// For Render specifically, you might need this:
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));
// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Course Registration API is running!',
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
app.use('/api/teacher/my-courses', myCourseRoutes);
app.use('/api/certificates', CertificateRoutes);
app.use('/api/my-learning', Mylearning);
app.use('/api/quiz', QuestionRoutes);
app.use('/api/certificates', CertificateRoutes);

// ❌ REMOVE THIS DUPLICATE LINE (line ~149 in your original code):
// app.use('/uploads', express.static('uploads'));

app.use('/api/teacher/courses', newCourse);
app.use('/api/email', emailRoutes);
app.use('/api/test/email-test', testEmailRoute);
app.use('/api/student/courses', studentCourseRoutes);

// Add this BEFORE app.use('/api/assignments', assignmentRoutes);
app.get('/api/debug/assignments-check', (req, res) => {
  console.log('🔍 Assignment routes check endpoint hit');
  res.json({
    success: true,
    message: 'Assignments debug endpoint working',
    routes: {
      assignmentRoutes: assignmentRoutes ? 'Imported' : 'Not imported',
      assignmentRoutesStack: assignmentRoutes?.stack?.length || 0
    }
  });
});

app.use('/api/assignments', assignmentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(`Course Registration Backend Active`);
});

module.exports = app;