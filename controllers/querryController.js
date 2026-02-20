// controllers/querryController.js
const QuerryForm = require('../models/querryFormModel');

// Submit a new query
// In querryController.js - update submitQuery function
const submitQuery = async (req, res) => {
  try {
    console.log('🔵 [1] Submitting new query');
    
    // If using studentAuth, you can get info from req.user
    const { name, email, phone, issue, suggestion } = req.body;
    
    // If student is authenticated, you can use their info from token
    // and ignore the body fields (or validate they match)
    const studentName = req.user?.name || name;
    const studentEmail = req.user?.email || email;

    // Validate required fields
    if (!studentName || !studentEmail || !phone || !issue || !suggestion) {
      console.log('❌ [2] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Create new query entry
    const newQuery = await QuerryForm.create({
      name: studentName,
      email: studentEmail,
      phone,
      issue,
      suggestion,
      studentId: req.user?.userId // Optional: track which student submitted
    });

    console.log('✅ [3] Query submitted successfully:', newQuery._id);

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted successfully',
      data: {
        id: newQuery._id,
        name: newQuery.name,
        email: newQuery.email,
        issue: newQuery.issue,
        suggestion: newQuery.suggestion,
        submittedAt: newQuery.createdAt || new Date()
      }
    });

  } catch (error) {
    console.error('❌ [ERROR] Query submission failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to submit query: ' + error.message
    });
  }
};
// Get all queries
const getAllQueries = async (req, res) => {
  try {
    console.log('🔵 [1] Fetching all queries');
    
    const queries = await QuerryForm.find({})
      .sort({ _id: -1 });

    console.log('✅ [2] Queries fetched successfully. Total:', queries.length);

    const formattedQueries = queries.map(query => ({
      id: query._id,
      name: query.name,
      email: query.email,
      phone: query.phone,
      issue: query.issue,
      suggestion: query.suggestion,
      submittedAt: query.createdAt || query._id.getTimestamp()
    }));

    res.status(200).json({
      success: true,
      count: formattedQueries.length,
      data: formattedQueries
    });

  } catch (error) {
    console.error('❌ [ERROR] Failed to fetch queries:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queries: ' + error.message
    });
  }
};

// Get single query by ID
const getQueryById = async (req, res) => {
  try {
    const query = await QuerryForm.findById(req.params.id);

    if (!query) {
      return res.status(404).json({
        success: false,
        error: 'Query not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: query._id,
        name: query.name,
        email: query.email,
        phone: query.phone,
        issue: query.issue,
        suggestion: query.suggestion,
        submittedAt: query.createdAt || query._id.getTimestamp()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query: ' + error.message
    });
  }
};

// Delete query
const deleteQuery = async (req, res) => {
  try {
    const query = await QuerryForm.findByIdAndDelete(req.params.id);

    if (!query) {
      return res.status(404).json({
        success: false,
        error: 'Query not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Query deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete query: ' + error.message
    });
  }
};

// Export all functions as an object
module.exports = {
  submitQuery,
  getAllQueries,
  getQueryById,
  deleteQuery
};