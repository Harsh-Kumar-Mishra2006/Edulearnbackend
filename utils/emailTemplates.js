// Predefined email templates content
const emailTemplates = {
  WELCOME_STUDENT: {
    name: 'welcome_student',
    subject: 'Welcome to {{appName}} - Start Your Learning Journey!',
    content: `
      <h1>Welcome to {{appName}}, {{studentName}}! 🎉</h1>
      <p>We're thrilled to have you join our learning community.</p>
      <p>Your account has been successfully created and you can now:</p>
      <ul>
        <li>Browse all available courses</li>
        <li>Track your learning progress</li>
        <li>Connect with instructors</li>
        <li>Access learning resources</li>
      </ul>
      <p>Get started by exploring our courses:</p>
      <a href="{{dashboardUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Go to Dashboard
      </a>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Happy Learning!<br>The {{appName}} Team</p>
    `,
    variables: ['studentName', 'appName', 'dashboardUrl']
  },

  ENROLLMENT_CONFIRMATION: {
    name: 'enrollment_confirmation',
    subject: '🎓 Enrollment Confirmed: {{courseName}}',
    content: `
      <h1>Congratulations! You're Enrolled 🎉</h1>
      <p>Dear {{studentName}},</p>
      <p>You have successfully enrolled in <strong>{{courseName}}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Course Details:</h3>
        <p><strong>Course:</strong> {{courseName}}</p>
        <p><strong>Instructor:</strong> {{instructorName}}</p>
        <p><strong>Duration:</strong> {{duration}}</p>
        <p><strong>Start Date:</strong> {{startDate}}</p>
      </div>
      
      <p>You can access the course materials here:</p>
      <a href="{{courseUrl}}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Access Course
      </a>
      
      <p>We're excited to have you in the class and can't wait to see your progress!</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    variables: ['studentName', 'courseName', 'instructorName', 'duration', 'startDate', 'courseUrl', 'appName']
  },

  PAYMENT_SUCCESS: {
    name: 'payment_success',
    subject: '✅ Payment Successful - {{courseName}}',
    content: `
      <h1>Payment Received Successfully! 💳</h1>
      <p>Dear {{studentName}},</p>
      <p>Your payment for <strong>{{courseName}}</strong> has been processed successfully.</p>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3>Payment Details:</h3>
        <p><strong>Amount Paid:</strong> ₹{{amount}}</p>
        <p><strong>Payment ID:</strong> {{paymentId}}</p>
        <p><strong>Date:</strong> {{paymentDate}}</p>
        <p><strong>Course:</strong> {{courseName}}</p>
      </div>
      
      <p>Your enrollment is now active. You can start learning immediately!</p>
      <a href="{{courseUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Start Learning Now
      </a>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Note:</strong> A copy of this receipt has been sent to your registered email for your records.
      </p>
      
      <p>Thank you for choosing {{appName}}!</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    variables: ['studentName', 'courseName', 'amount', 'paymentId', 'paymentDate', 'courseUrl', 'appName']
  },

  PAYMENT_PENDING: {
    name: 'payment_pending',
    subject: '⏳ Payment Verification Pending - {{courseName}}',
    content: `
      <h1>Payment Under Verification 🔍</h1>
      <p>Dear {{studentName}},</p>
      <p>We have received your payment screenshot for <strong>{{courseName}}</strong>.</p>
      <p>Our team is currently verifying the payment. This process usually takes 1-2 business hours.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3>Course Details:</h3>
        <p><strong>Course:</strong> {{courseName}}</p>
        <p><strong>Amount:</strong> ₹{{amount}}</p>
        <p><strong>Submitted:</strong> {{submissionTime}}</p>
      </div>
      
      <p>You will receive another email once your payment is verified and enrollment is confirmed.</p>
      <p>If you have any questions about your payment, please contact our support team.</p>
      
      <p>Thank you for your patience!<br>The {{appName}} Team</p>
    `,
    variables: ['studentName', 'courseName', 'amount', 'submissionTime', 'appName']
  },

  COURSE_REMINDER: {
    name: 'course_reminder',
    subject: '📚 Continue your learning in {{courseName}}', // FIXED: Removed apostrophe issue
    content: `
      <h1>Keep the Learning Momentum Going! 🚀</h1>
      <p>Hi {{studentName}},</p>
      <p>We noticed you haven't accessed <strong>{{courseName}}</strong> in {{daysInactive}} days.</p>
      
      <p>Remember why you started? This course can help you:</p>
      <ul>
        <li>{{benefit1}}</li>
        <li>{{benefit2}}</li>
        <li>{{benefit3}}</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{courseUrl}}" style="background-color: #9C27B0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Resume Learning Now
        </a>
      </div>
      
      <p>Your progress so far: <strong>{{progressPercentage}}%</strong></p>
      <div style="background-color: #e0e0e0; border-radius: 10px; height: 10px; margin: 10px 0;">
        <div style="background-color: #4CAF50; width: {{progressPercentage}}%; height: 10px; border-radius: 10px;"></div>
      </div>
      
      <p>Just {{remainingContent}} left to complete the course!</p>
      <p>You're doing great! Keep going! 💪</p>
      
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    variables: ['studentName', 'courseName', 'daysInactive', 'benefit1', 'benefit2', 'benefit3', 'courseUrl', 'progressPercentage', 'remainingContent', 'appName']
  },

  PASSWORD_RESET: {
    name: 'password_reset',
    subject: '🔐 Password Reset Request - {{appName}}',
    content: `
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password for your {{appName}} account.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p>This link will expire in {{expiryTime}}.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; color: #666;">
        <p><strong>Note:</strong> If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      
      <p>Best regards,<br>The {{appName}} Security Team</p>
    `,
    variables: ['resetUrl', 'expiryTime', 'appName']
  },

  // ✅ ADD TEACHER WELCOME TEMPLATE
  TEACHER_WELCOME: {
    name: 'teacher_welcome',
    subject: '👨‍🏫 Welcome to {{appName}} Teacher Portal - Your Account Credentials',
    content: `
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
    `,
    variables: ['teacherName', 'username', 'tempPassword', 'appName', 'loginUrl', 'teacherPortalUrl', 'adminName', 'adminEmail', 'supportEmail', 'year']
  }
};

module.exports = emailTemplates;