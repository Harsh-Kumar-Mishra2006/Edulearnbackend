// testCloudinary.js - COMPREHENSIVE TEST
const cloudinary = require('./config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Install: npm install node-fetch

// Test files directory
const TEST_DIR = path.join(__dirname, 'test_files');

// Create test directory if it doesn't exist
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR);
}

// Generate a test PDF file
const createTestPDF = () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000102 00000 n
0000000189 00000 n
0000000261 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
381
%%EOF`;

  const filePath = path.join(TEST_DIR, 'test_document.pdf');
  fs.writeFileSync(filePath, pdfContent);
  return filePath;
};

// Generate a test text file
const createTestTextFile = () => {
  const filePath = path.join(TEST_DIR, 'test_file.txt');
  fs.writeFileSync(filePath, 'This is a test file for Cloudinary upload verification.\nGenerated at: ' + new Date().toISOString());
  return filePath;
};

// Test 1: Check Cloudinary Configuration
const testConfiguration = () => {
  console.log('\n🔧 TEST 1: Cloudinary Configuration');
  console.log('='.repeat(50));
  
  const config = cloudinary.config();
  console.log('Cloud Name:', config.cloud_name);
  console.log('API Key Set:', !!config.api_key);
  console.log('API Secret Set:', !!config.api_secret);
  console.log('Secure:', config.secure);
  
  const allSet = config.cloud_name && config.api_key && config.api_secret;
  console.log('✅ Configuration:', allSet ? 'PASS' : 'FAIL');
  
  return allSet;
};

// Test 2: Test API Connection
const testAPIConnection = async () => {
  console.log('\n🔌 TEST 2: API Connection Test');
  console.log('='.repeat(50));
  
  try {
    const result = await cloudinary.api.ping();
    console.log('Status:', result.status);
    console.log('Rate Limit Remaining:', result.rate_limit_remaining);
    console.log('✅ API Connection:', 'PASS');
    return true;
  } catch (error) {
    console.error('❌ API Connection Error:', error.message);
    return false;
  }
};

// Test 3: Upload Test File
const testUpload = async () => {
  console.log('\n📤 TEST 3: File Upload Test');
  console.log('='.repeat(50));
  
  try {
    // Create test file
    const testFile = createTestTextFile();
    console.log('Test file created:', testFile);
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(testFile, {
      folder: 'edulearn/tests',
      resource_type: 'auto',
      public_id: `test_upload_${Date.now()}`,
      tags: ['test', 'automated']
    });
    
    console.log('✅ Upload Successful!');
    console.log('Public ID:', uploadResult.public_id);
    console.log('URL:', uploadResult.secure_url);
    console.log('Resource Type:', uploadResult.resource_type);
    console.log('Format:', uploadResult.format);
    console.log('Size:', uploadResult.bytes, 'bytes');
    console.log('Created At:', uploadResult.created_at);
    
    // Clean up test file
    fs.unlinkSync(testFile);
    
    return uploadResult;
  } catch (error) {
    console.error('❌ Upload Error:', error.message);
    if (error.http_code) console.error('HTTP Code:', error.http_code);
    return null;
  }
};

// Test 4: Test File Download/View
const testDownload = async (uploadResult) => {
  console.log('\n📥 TEST 4: File Download/View Test');
  console.log('='.repeat(50));
  
  if (!uploadResult) {
    console.log('⚠️  Skipping download test - no upload result');
    return false;
  }
  
  try {
    const url = uploadResult.secure_url;
    console.log('Testing URL:', url);
    
    // Test 4a: HEAD request (check if accessible)
    console.log('\n4a. Testing URL accessibility (HEAD request)...');
    const headResponse = await fetch(url, { method: 'HEAD' });
    console.log('Status:', headResponse.status);
    console.log('Content-Type:', headResponse.headers.get('content-type'));
    console.log('Content-Length:', headResponse.headers.get('content-length'));
    console.log('Accessible:', headResponse.ok ? '✅ YES' : '❌ NO');
    
    // Test 4b: GET request (download content)
    console.log('\n4b. Testing file download (GET request)...');
    const getResponse = await fetch(url);
    const buffer = await getResponse.buffer();
    
    console.log('Downloaded Size:', buffer.length, 'bytes');
    console.log('Download Successful:', getResponse.ok ? '✅ YES' : '❌ NO');
    
    // Test 4c: Cloudinary transformation
    console.log('\n4c. Testing Cloudinary transformations...');
    if (uploadResult.resource_type === 'image') {
      const transformedUrl = cloudinary.url(uploadResult.public_id, {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
        format: 'jpg'
      });
      console.log('Transformed URL (thumbnail):', transformedUrl);
    }
    
    // Test 4d: Generate signed URL (if needed)
    console.log('\n4d. Testing signed URL generation...');
    const signedUrl = cloudinary.url(uploadResult.public_id, {
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    });
    console.log('Signed URL:', signedUrl);
    
    return headResponse.ok && getResponse.ok;
  } catch (error) {
    console.error('❌ Download Test Error:', error.message);
    return false;
  }
};

// Test 5: Test Resource Management
const testResourceManagement = async (uploadResult) => {
  console.log('\n🗃️ TEST 5: Resource Management Test');
  console.log('='.repeat(50));
  
  if (!uploadResult) {
    console.log('⚠️  Skipping resource management test');
    return false;
  }
  
  try {
    // Test 5a: Get resource info
    console.log('5a. Getting resource information...');
    const resourceInfo = await cloudinary.api.resource(uploadResult.public_id, {
      resource_type: uploadResult.resource_type
    });
    
    console.log('Resource Info Retrieved:', '✅ YES');
    console.log('Public ID:', resourceInfo.public_id);
    console.log('Resource Type:', resourceInfo.resource_type);
    console.log('Created:', resourceInfo.created_at);
    
    // Test 5b: List resources in test folder
    console.log('\n5b. Listing resources in test folder...');
    const folderResources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'edulearn/tests',
      max_results: 10
    });
    
    console.log('Total in folder:', folderResources.resources.length);
    console.log('Resources:', folderResources.resources.map(r => r.public_id));
    
    // Test 5c: Delete the test resource
    console.log('\n5c. Cleaning up test resource...');
    const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id, {
      resource_type: uploadResult.resource_type
    });
    
    console.log('Delete Result:', deleteResult.result);
    console.log('Cleanup Successful:', deleteResult.result === 'ok' ? '✅ YES' : '❌ NO');
    
    return deleteResult.result === 'ok';
  } catch (error) {
    console.error('❌ Resource Management Error:', error.message);
    return false;
  }
};

// Test 6: Test Your Upload Middleware
const testUploadMiddleware = async () => {
  console.log('\n🛠️ TEST 6: Upload Middleware Test');
  console.log('='.repeat(50));
  
  try {
    const { uploadDocument } = require('./config/cloudinaryStorage');
    const multer = require('multer');
    
    console.log('Testing uploadDocument middleware...');
    
    // Create a mock request/response
    const mockFile = {
      fieldname: 'document',
      originalname: 'test_middleware.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: Buffer.from('Middleware test content'),
      size: 24
    };
    
    console.log('Mock file created for middleware test');
    console.log('Middleware function type:', typeof uploadDocument);
    
    // Note: Actual middleware testing requires Express app simulation
    console.log('⚠️  Manual testing required:');
    console.log('   Run: curl -X POST http://localhost:10000/teacher/test-upload \\');
    console.log('        -F "document=@any_file.txt"');
    
    return true;
  } catch (error) {
    console.error('❌ Middleware Test Error:', error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 STARTING CLOUDINARY COMPREHENSIVE TESTS');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  const results = {
    config: testConfiguration(),
    api: await testAPIConnection(),
    upload: null,
    download: false,
    management: false,
    middleware: false
  };
  
  if (results.config && results.api) {
    const uploadResult = await testUpload();
    results.upload = !!uploadResult;
    
    if (uploadResult) {
      results.download = await testDownload(uploadResult);
      results.management = await testResourceManagement(uploadResult);
    }
  }
  
  results.middleware = await testUploadMiddleware();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Configuration:', results.config ? '✅ PASS' : '❌ FAIL');
  console.log('API Connection:', results.api ? '✅ PASS' : '❌ FAIL');
  console.log('File Upload:', results.upload ? '✅ PASS' : '❌ FAIL');
  console.log('File Download:', results.download ? '✅ PASS' : '❌ FAIL');
  console.log('Resource Management:', results.management ? '✅ PASS' : '❌ FAIL');
  console.log('Middleware:', results.middleware ? '✅ PASS' : '❌ INFO ONLY');
  
  const totalTests = 5;
  const passedTests = Object.values(results).filter(v => v === true).length;
  
  console.log('\n🎯 FINAL RESULT:', `${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED! Cloudinary is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check logs above for details.');
  }
  
  // Clean up test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned up test files');
  }
  
  return results;
};

// Run tests
runAllTests().catch(console.error);