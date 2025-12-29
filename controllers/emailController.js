const EmailService = require('../services/emailService');
const EmailTemplate = require('../models/emailTemplete');
const emailTemplates = require('../utils/emailTemplates');
const EmailLog = require('../models/emailLog');
const { logger } = require('../utils/logger');

class EmailController {
  // Send email using template
  async sendEmail(req, res) {
    try {
      const { templateName, to, variables, metadata } = req.body;

      if (!templateName || !to) {
        return res.status(400).json({
          success: false,
          error: 'Template name and recipient email are required'
        });
      }

      const result = await EmailService.sendTemplateEmail(templateName, to, variables, metadata);

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in sendEmail controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Send bulk emails
  async sendBulkEmails(req, res) {
    try {
      const { templateName, recipients, variablesArray, metadata } = req.body;

      if (!templateName || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({
          success: false,
          error: 'Template name and recipients array are required'
        });
      }

      const results = await EmailService.sendBulkEmails(templateName, recipients, variablesArray, metadata);

      res.json({
        success: true,
        message: 'Bulk email sending completed',
        data: {
          total: recipients.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      logger.error('Error in sendBulkEmails controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get email statistics
  async getEmailStats(req, res) {
    try {
      const stats = await EmailService.getEmailStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getEmailStats controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get email logs
  async getEmailLogs(req, res) {
    try {
      const { page = 1, limit = 20, status, to, startDate, endDate } = req.query;
      
      const query = {};
      
      if (status) query.status = status;
      if (to) query.to = { $regex: to, $options: 'i' };
      if (startDate || endDate) {
        query.sentAt = {};
        if (startDate) query.sentAt.$gte = new Date(startDate);
        if (endDate) query.sentAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        EmailLog.find(query)
          .sort({ sentAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        EmailLog.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error in getEmailLogs controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Initialize email templates
  async initializeTemplates(req, res) {
    try {
      const templates = Object.values(emailTemplates);
      const results = [];

      for (const template of templates) {
        const existing = await EmailTemplate.findOne({ name: template.name });
        
        if (!existing) {
          const newTemplate = new EmailTemplate({
            name: template.name,
            subject: template.subject,
            content: template.content,
            variables: template.variables,
            category: template.name.split('_')[0],
            isActive: true
          });

          await newTemplate.save();
          results.push({ template: template.name, status: 'created' });
        } else {
          results.push({ template: template.name, status: 'exists' });
        }
      }

      // Reload templates in service
      await EmailService.loadTemplates();

      res.json({
        success: true,
        message: 'Email templates initialized',
        data: results
      });
    } catch (error) {
      logger.error('Error in initializeTemplates controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update email template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const template = await EmailTemplate.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Reload templates in service
      await EmailService.loadTemplates();

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      logger.error('Error in updateTemplate controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new EmailController();