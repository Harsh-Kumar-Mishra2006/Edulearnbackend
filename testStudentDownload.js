// testStudentDownload.js
const mongoose = require('mongoose');
const CourseMaterial = require('./models/courseMaterialdata');
require('dotenv').config();

async function testDatabaseData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
  
  console.log('🧪 TESTING DATABASE DATA FOR STUDENT DOWNLOAD\n');
  console.log('='.repeat(60));
  
  // Get first published course
  const course = await CourseMaterial.findOne({ status: 'published' })
    .populate('teacher_id', 'name');
  
  if (!course) {
    console.log('❌ No published courses found');
    await mongoose.disconnect();
    return;
  }
  
  console.log(`📚 Course: ${course.course_title}`);
  console.log(`👨‍🏫 Teacher: ${course.teacher_id?.name || 'Unknown'}`);
  console.log(`🏷️ Category: ${course.course_category}`);
  console.log(`📊 Status: ${course.status}`);
  console.log('');
  
  // Test videos
  console.log(`🎥 VIDEOS (${course.materials.videos.length}):`);
  course.materials.videos.forEach((video, index) => {
    console.log(`  ${index + 1}. ${video.title}`);
    console.log(`     URL: ${video.video_url ? '✅' : '❌'} ${video.video_url || 'No URL'}`);
    console.log(`     Public ID: ${video.public_id ? '✅' : '❌'} ${video.public_id || 'No public_id'}`);
    console.log(`     is_public: ${video.is_public ? '✅ Yes' : '❌ No'}`);
    console.log(`     Size: ${video.file_size ? (video.file_size / 1024 / 1024).toFixed(2) + 'MB' : 'Unknown'}`);
    
    // Test Cloudinary URL
    if (video.public_id) {
      const testUrl = `https://res.cloudinary.com/dpsssv5tg/video/upload/${video.public_id}`;
      console.log(`     Test URL: ${testUrl}`);
      console.log(`     📋 Open in browser: ${testUrl}`);
    }
    console.log('');
  });
  
  // Test documents
  console.log(`📄 DOCUMENTS (${course.materials.documents.length}):`);
  course.materials.documents.forEach((doc, index) => {
    console.log(`  ${index + 1}. ${doc.title}`);
    console.log(`     URL: ${doc.file_url ? '✅' : '❌'} ${doc.file_url || 'No URL'}`);
    console.log(`     Public ID: ${doc.public_id ? '✅' : '❌'} ${doc.public_id || 'No public_id'}`);
    console.log(`     Type: ${doc.file_type}`);
    console.log(`     is_public: ${doc.is_public ? '✅ Yes' : '❌ No'}`);
    console.log(`     Size: ${doc.file_size ? (doc.file_size / 1024).toFixed(2) + 'KB' : 'Unknown'}`);
    
    // Test Cloudinary URL
    if (doc.public_id) {
      const resourceType = doc.file_type === 'pdf' ? 'image' : 'raw';
      const testUrl = `https://res.cloudinary.com/dpsssv5tg/${resourceType}/upload/${doc.public_id}`;
      console.log(`     Test URL: ${testUrl}`);
      console.log(`     📋 Open in browser: ${testUrl}`);
    }
    console.log('');
  });
  
  // Summary
  console.log('📊 SUMMARY:');
  const totalVideos = course.materials.videos.length;
  const totalDocs = course.materials.documents.length;
  const videosWithUrl = course.materials.videos.filter(v => v.video_url).length;
  const docsWithUrl = course.materials.documents.filter(d => d.file_url).length;
  const videosWithPublicId = course.materials.videos.filter(v => v.public_id).length;
  const docsWithPublicId = course.materials.documents.filter(d => d.public_id).length;
  
  console.log(`   Total Materials: ${totalVideos + totalDocs}`);
  console.log(`   Videos with URL: ${videosWithUrl}/${totalVideos} ${videosWithUrl === totalVideos ? '✅' : '❌'}`);
  console.log(`   Docs with URL: ${docsWithUrl}/${totalDocs} ${docsWithUrl === totalDocs ? '✅' : '❌'}`);
  console.log(`   Videos with Public ID: ${videosWithPublicId}/${totalVideos} ${videosWithPublicId === totalVideos ? '✅' : '❌'}`);
  console.log(`   Docs with Public ID: ${docsWithPublicId}/${totalDocs} ${docsWithPublicId === totalDocs ? '✅' : '❌'}`);
  
  console.log('\n🔗 TEST ENDPOINTS:');
  console.log(`   1. Student My Learning: GET /api/student/courses`);
  console.log(`   2. Download Video: GET /api/student/download/video/${course._id}/${course.materials.videos[0]?._id}`);
  console.log(`   3. Download Doc: GET /api/student/download/document/${course._id}/${course.materials.documents[0]?._id}`);
  console.log(`   4. View File: GET /api/student/view/${course.materials.documents[0]?.public_id}`);
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

testDatabaseData().catch(console.error);