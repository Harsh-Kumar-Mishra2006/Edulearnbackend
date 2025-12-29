const transporter = require('../config/emailConfig');
const EmailLog = require('../models/emailLog');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.templates = {
      'teacher_welcome': {
        subject: '👨‍🏫 Welcome to {{appName}} Teacher Portal - Your Account Credentials',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
              <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  .credentials { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
                  .password-display { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; background: #1e293b; color: white; padding: 10px 15px; border-radius: 6px; letter-spacing: 2px; text-align: center; margin: 10px 0; }
                  .important-note { background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                  .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1 style="margin: 0;">Welcome to {{appName}} Teacher Portal!</h1>
                      <p style="margin: 10px 0 0; opacity: 0.9;">Your teaching journey begins now 👨‍🏫</p>
                  </div>
                  
                  <div class="content">
                      <p>Dear <strong style="color: #4f46e5;">{{teacherName}}</strong>,</p>
                      
                      <p>Welcome to the {{appName}} teaching community! Your account has been successfully created by our administrator.</p>
                      
                      <div class="credentials">
                          <h3 style="color: #0ea5e9; margin-top: 0;">🔐 Your Login Credentials:</h3>
                          
                          <p><strong>👤 Username/Email:</strong><br>
                          <span style="color: #1e293b;">{{username}}</span></p>
                          
                          <p><strong>🔑 Temporary Password:</strong></p>
                          <div class="password-display">{{tempPassword}}</div>
                          
                          <p><strong>🌐 Login URL:</strong><br>
                          <a href="{{loginUrl}}" style="color: #0ea5e9; text-decoration: none;">{{loginUrl}}</a></p>
                      </div>
                      
                      <div class="important-note">
                          <h4 style="color: #d97706; margin-top: 0;">⚠️ Important Security Notice</h4>
                          <p><strong>For security reasons, please change your password immediately after your first login.</strong></p>
                          <p style="font-size: 14px; margin: 5px 0;">This temporary password should not be shared with anyone.</p>
                      </div>
                      
                      <h3 style="color: #4f46e5;">🎯 Teacher Portal Features:</h3>
                      <ul style="padding-left: 20px;">
                          <li>📚 Create and manage your courses</li>
                          <li>📝 Upload study materials and assignments</li>
                          <li>📊 Track student progress and performance</li>
                          <li>🎥 Conduct live online classes</li>
                          <li>📋 Evaluate student submissions and provide feedback</li>
                          <li>💬 Communicate with students through messaging</li>
                      </ul>
                      
                      <div style="text-align: center; margin: 30px 0;">
                          <a href="{{teacherPortalUrl}}" class="button">🚀 Access Teacher Dashboard</a>
                      </div>
                      
                      <div class="footer">
                          <p><strong>Need Help?</strong></p>
                          <p>• Admin Contact: {{adminName}} ({{adminEmail}})</p>
                          <p>• Support Team: {{supportEmail}}</p>
                          <p>• Office Hours: Monday-Friday, 9 AM - 6 PM</p>
                          <p>© {{year}} {{appName}}. All rights reserved.</p>
                      </div>
                  </div>
              </div>
          </body>
          </html>
        `
      }
    };
  }

  // Replace variables in template
  replaceVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  // Send email with template
  async sendTemplateEmail(templateName, to, variables = {}, metadata = {}) {
    let emailLog;
    
    try {
      console.log('📧 EmailService: Starting to send email...');
      console.log('📧 Template:', templateName);
      console.log('📧 To:', to);
      console.log('📧 Variables:', variables);

      const template = this.templates[templateName];
      
      if (!template) {
        throw new Error(`Template "${templateName}" not found`);
      }

      // Create email log
      emailLog = new EmailLog({
        to,
        subject: this.replaceVariables(template.subject, variables),
        template: templateName,
        metadata
      });

      await emailLog.save();
      console.log('📧 Email log created:', emailLog._id);

      // Prepare email options
      const mailOptions = {
        from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to,
        subject: this.replaceVariables(template.subject, variables),
        html: this.replaceVariables(template.html, variables),
        text: `Welcome to ${process.env.APP_NAME}. Your credentials: Username: ${variables.username}, Password: ${variables.tempPassword}`
      };

      console.log('📧 Mail options prepared');
      console.log('📧 From:', mailOptions.from);
      console.log('📧 Subject:', mailOptions.subject);

      // Send email
      console.log('📧 Attempting to send email via transporter...');
      const info = await transporter.sendMail(mailOptions);
      
      console.log('📧 Email sent! Message ID:', info.messageId);
      console.log('📧 Response:', info.response);
      
      // Update email log
      emailLog.status = 'sent';
      emailLog.messageId = info.messageId;
      await emailLog.save();

      console.log(`✅ Email sent to ${to} with template "${templateName}"`);
      
      return { success: true, messageId: info.messageId, emailLog };
      
    } catch (error) {
      console.error('❌ ERROR in EmailService.sendTemplateEmail:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Update email log with error
      if (emailLog) {
        emailLog.status = 'failed';
        emailLog.error = error.message;
        await emailLog.save();
        console.log('📧 Email log updated with error');
      }
      
      throw error;
    }
  }
}

module.exports = new EmailService();