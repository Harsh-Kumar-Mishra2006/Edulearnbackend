// testAPI.js - API ENDPOINT TESTING
const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_URL || 'https://edulearnbackend-ffiv.onrender.com';
const TEACHER_TOKEN = process.env.TEST_TEACHER_TOKEN; // Set your token here

// Test endpoints
const endpoints = {
  testAuth: '/teacher/test-auth',
  testCloudinary: '/teacher/test-cloudinary',
  testUpload: '/teacher/test-upload',
  createCourse: '/teacher/courses',
  uploadDocument: '/teacher/courses/{course_id}/documents'
};

// Helper function to make requests
const makeRequest = async (method, endpoint, data = null, contentType = 'application/json') => {
  const url = BASE_URL + endpoint;
  const headers = {
    'Authorization': `Bearer ${TEACHER_TOKEN}`,
    'Content-Type': contentType
  };
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    if (contentType === 'application/json') {
      options.body = JSON.stringify(data);
    } else if (contentType.startsWith('multipart/form-data')) {
      // Remove Content-Type header for FormData (it will be set automatically)
      delete headers['Content-Type'];
      options.body = data;
    }
  }
  
  console.log(`\n🔍 ${method} ${endpoint}`);
  console.log('Request Headers:', headers);
  
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', responseData);
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('Request Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test 1: Authentication
const testAuthentication = async () => {
  console.log('\n🔐 TEST 1: Authentication');
  console.log('='.repeat(50));
  
  if (!TEACHER_TOKEN) {
    console.log('⚠️  No teacher token provided. Set TEST_TEACHER_TOKEN environment variable.');
    return false;
  }
  
  const result = await makeRequest('GET', endpoints.testAuth);
  return result.success && result.data && result.data.success;
};

// Test 2: Cloudinary Configuration
const testCloudinaryEndpoint = async () => {
  console.log('\n☁️ TEST 2: Cloudinary Configuration Endpoint');
  console.log('='.repeat(50));
  
  const result = await makeRequest('GET', endpoints.testCloudinary);
  return result.success && result.data && result.data.success;
};

// Test 3: Test Upload Endpoint
const testUploadEndpoint = async () => {
  console.log('\n📤 TEST 3: Test Upload Endpoint');
  console.log('='.repeat(50));
  
  // Create a simple text file for testing
  const FormData = require('form-data');
  const fs = require('fs');
  const path = require('path');
  
  // Create test file
  const testDir = path.join(__dirname, 'temp_test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const testFile = path.join(testDir, 'test_upload.txt');
  fs.writeFileSync(testFile, 'Test content for upload endpoint');
  
  // Prepare FormData
  const formData = new FormData();
  formData.append('document', fs.createReadStream(testFile));
  
  const result = await makeRequest('POST', endpoints.testUpload, formData, 'multipart/form-data');
  
  // Clean up
  fs.unlinkSync(testFile);
  fs.rmdirSync(testDir);
  
  return result.success && result.data && result.data.success;
};

// Test 4: Create Course
const testCreateCourse = async () => {
  console.log('\n📚 TEST 4: Create Course');
  console.log('='.repeat(50));
  
  const courseData = {
    course_title: 'Test Course ' + Date.now(),
    course_description: 'This is a test course for API testing',
    course_category: 'Web Development',
    tags: ['test', 'api']
  };
  
  const result = await makeRequest('POST', endpoints.createCourse, courseData);
  
  if (result.success && result.data && result.data.success) {
    console.log('✅ Course created with ID:', result.data.data._id);
    return result.data.data._id; // Return course ID for next tests
  }
  
  return null;
};

// Test 5: Upload Document to Course
const testUploadToCourse = async (courseId) => {
  console.log('\n📎 TEST 5: Upload Document to Course');
  console.log('='.repeat(50));
  
  if (!courseId) {
    console.log('⚠️  No course ID provided. Skipping...');
    return false;
  }
  
  const endpoint = endpoints.uploadDocument.replace('{course_id}', courseId);
  
  // Create test PDF
  const FormData = require('form-data');
  const fs = require('fs');
  const path = require('path');
  
  const testDir = path.join(__dirname, 'temp_test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const testFile = path.join(testDir, 'course_document.pdf');
  
  // Create a minimal PDF
  const pdfContent = `%PDF-1.4
% Test PDF
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 200 100]/Contents 5 0 R>> endobj
4 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj
5 0 obj <</Length 50>> stream
BT /F1 12 Tf 10 50 Td (Test Document) Tj ET
endstream endobj xref 0 6 trailer <</Size 6/Root 1 0 R>> startxref 300 %%EOF`;
  
  fs.writeFileSync(testFile, pdfContent);
  
  // Prepare FormData
  const formData = new FormData();
  formData.append('document', fs.createReadStream(testFile));
  formData.append('title', 'API Test Document');
  formData.append('description', 'Uploaded via API test');
  formData.append('document_type', 'notes');
  
  const result = await makeRequest('POST', endpoint, formData, 'multipart/form-data');
  
  // Clean up
  fs.unlinkSync(testFile);
  fs.rmdirSync(testDir);
  
  if (result.success && result.data && result.data.success) {
    console.log('✅ Document uploaded successfully');
    console.log('Document URL:', result.data.data.document.file_url);
    return true;
  }
  
  return false;
};

// Run all API tests
const runAPITests = async () => {
  console.log('🚀 STARTING API ENDPOINT TESTS');
  console.log('='.repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Timestamp:', new Date().toISOString());
  
  const results = {
    auth: await testAuthentication(),
    cloudinary: await testCloudinaryEndpoint(),
    upload: await testUploadEndpoint(),
    courseId: null,
    courseUpload: false
  };
  
  if (results.auth) {
    results.courseId = await testCreateCourse();
    
    if (results.courseId) {
      results.courseUpload = await testUploadToCourse(results.courseId);
    }
  }
  
  // Summary
  console.log('\n📊 API TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Cloudinary Config:', results.cloudinary ? '✅ PASS' : '❌ FAIL');
  console.log('Test Upload:', results.upload ? '✅ PASS' : '❌ FAIL');
  console.log('Course Created:', results.courseId ? '✅ PASS' : '❌ FAIL');
  console.log('Course Document Upload:', results.courseUpload ? '✅ PASS' : '❌ FAIL');
  
  const totalTests = 5;
  const passedTests = Object.values(results).filter(v => v === true).length;
  
  console.log('\n🎯 FINAL RESULT:', `${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ ALL API TESTS PASSED! Backend is working correctly.');
  } else {
    console.log('⚠️  Some API tests failed. Check the logs above for details.');
  }
  
  return results;
};

// Export for use in other files
module.exports = {
  runAPITests,
  makeRequest,
  endpoints
};

// Run if called directly
if (require.main === module) {
  runAPITests().catch(console.error);
}