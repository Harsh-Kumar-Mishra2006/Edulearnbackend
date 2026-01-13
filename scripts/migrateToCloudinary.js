// scripts/migrateToCloudinary.js
const mongoose = require('mongoose');
const CourseMaterial = require('../models/courseMaterialdata');
const cloudinary = require('../config/cloudinaryConfig');
const path = require('path');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const migrateCourseFiles = async () => {
  try {
    console.log('🔍 Starting migration of files to Cloudinary...');
    
    const courses = await CourseMaterial.find({});
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const course of courses) {
      console.log(`\n📚 Processing course: ${course.course_title}`);
      let courseUpdated = false;
      
      // Migrate videos
      for (const video of course.materials.videos) {
        if (video.video_url && video.video_url.startsWith('/uploads/')) {
          console.log(`  🎥 Found old video: ${video.title}`);
          
          // Mark for re-upload
          video.video_url = 'NEEDS_REUPLOAD';
          video.isAvailable = false;
          courseUpdated = true;
          migratedCount++;
        }
      }
      
      // Migrate documents
      for (const doc of course.materials.documents) {
        if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
          console.log(`  📄 Found old document: ${doc.title}`);
          
          // Mark for re-upload
          doc.file_url = 'NEEDS_REUPLOAD';
          doc.isAvailable = false;
          courseUpdated = true;
          migratedCount++;
        }
      }
      
      if (courseUpdated) {
        await course.save();
        console.log(`  ✅ Updated course in database`);
      }
    }
    
    console.log(`\n🎉 Migration Complete!`);
    console.log(`📊 Total files marked for re-upload: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n📝 NEXT STEPS:`);
    console.log(`1. Teachers need to re-upload marked files`);
    console.log(`2. New uploads will use Cloudinary`);
    console.log(`3. Old uploads will show as "Unavailable"`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateCourseFiles();