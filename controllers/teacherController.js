// controllers/teacherController.js
const Payment = require('../models/paymentModel');

// Get all student payment records
const getStudentRecords = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      payments,
      total: payments.length
    });

  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({ 
      success: false,
      error: "Error fetching student records: " + error.message 
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be pending, verified, or rejected"
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment record not found"
      });
    }

    res.json({
      success: true,
      message: `Payment ${status} successfully`,
      payment
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false,
      error: "Error updating payment status: " + error.message 
    });
  }
};

module.exports = {
  getStudentRecords,
  updatePaymentStatus
};