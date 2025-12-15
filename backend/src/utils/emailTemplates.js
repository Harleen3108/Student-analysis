/**
 * Email Templates for Student Dropout Prevention System
 * Contains HTML templates for various email notifications
 */

/**
 * Base email template wrapper
 */
const baseTemplate = (title, content, footerText = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px 20px;
        }
        .content h2 {
            color: #4F46E5;
            margin-top: 0;
            font-size: 20px;
        }
        .content h3 {
            color: #374151;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #3730A3;
        }
        .alert {
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .alert-info {
            background-color: #EBF8FF;
            border-left: 4px solid #3182CE;
            color: #2A4A5C;
        }
        .alert-warning {
            background-color: #FFFBEB;
            border-left: 4px solid #F59E0B;
            color: #92400E;
        }
        .alert-danger {
            background-color: #FEF2F2;
            border-left: 4px solid #EF4444;
            color: #991B1B;
        }
        .alert-success {
            background-color: #F0FDF4;
            border-left: 4px solid #10B981;
            color: #065F46;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background-color: #F9FAFB;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #E5E7EB;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
        }
        .stat-label {
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            background-color: #F9FAFB;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
            border-top: 1px solid #E5E7EB;
        }
        .footer a {
            color: #4F46E5;
            text-decoration: none;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .table th,
        .table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
        }
        .table th {
            background-color: #F9FAFB;
            font-weight: 600;
            color: #374151;
        }
        .risk-low { color: #10B981; font-weight: 600; }
        .risk-medium { color: #F59E0B; font-weight: 600; }
        .risk-high { color: #EF4444; font-weight: 600; }
        .risk-critical { color: #7C3AED; font-weight: 600; }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Student Dropout Prevention System</h1>
            <p>Empowering Education Through Early Intervention</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            ${footerText || `
                <p>This is an automated notification from the Student Dropout Prevention System.</p>
                <p>Please do not reply to this email. For support, contact your school administrator.</p>
                <p>&copy; ${new Date().getFullYear()} Student Dropout Prevention System. All rights reserved.</p>
            `}
        </div>
    </div>
</body>
</html>
`;

/**
 * Welcome email template
 */
export const welcomeTemplate = (data) => {
  const { userName, userRole, loginUrl, tempPassword } = data;
  
  const content = `
    <h2>Welcome to the Student Dropout Prevention System!</h2>
    <p>Dear ${userName},</p>
    <p>Your account has been successfully created with the following details:</p>
    
    <div class="alert alert-info">
        <strong>Account Information:</strong><br>
        <strong>Role:</strong> ${userRole}<br>
        <strong>Email:</strong> ${data.email}<br>
        ${tempPassword ? `<strong>Temporary Password:</strong> ${tempPassword}<br>` : ''}
    </div>
    
    <p>You can now access the system using the button below:</p>
    <a href="${loginUrl}" class="button">Login to System</a>
    
    ${tempPassword ? `
    <div class="alert alert-warning">
        <strong>Important:</strong> Please change your temporary password after your first login for security purposes.
    </div>
    ` : ''}
    
    <p>If you have any questions or need assistance, please contact your system administrator.</p>
    <p>Best regards,<br>Student Dropout Prevention Team</p>
  `;
  
  return baseTemplate("Welcome to SDPS", content);
};

/**
 * Password reset email template
 */
export const passwordResetTemplate = (data) => {
  const { userName, resetUrl, expiryTime } = data;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Dear ${userName},</p>
    <p>We received a request to reset your password for the Student Dropout Prevention System.</p>
    
    <p>Click the button below to reset your password:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    
    <div class="alert alert-warning">
        <strong>Important Security Information:</strong><br>
        • This link will expire in ${expiryTime || '1 hour'}<br>
        • If you didn't request this reset, please ignore this email<br>
        • Never share this link with anyone
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6B7280; font-size: 12px;">${resetUrl}</p>
    
    <p>For security reasons, this link can only be used once.</p>
    <p>Best regards,<br>Student Dropout Prevention Team</p>
  `;
  
  return baseTemplate("Password Reset Request", content);
};

/**
 * Attendance alert email template
 */
export const attendanceAlertTemplate = (data) => {
  const { studentName, rollNumber, attendancePercentage, consecutiveAbsences, parentName, className } = data;
  
  const alertType = attendancePercentage < 50 ? 'danger' : attendancePercentage < 75 ? 'warning' : 'info';
  
  const content = `
    <h2>Attendance Alert</h2>
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    
    <div class="alert alert-${alertType}">
        <strong>Attendance Concern for ${studentName}</strong><br>
        Current attendance is below the required threshold and needs immediate attention.
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${attendancePercentage}%</div>
            <div class="stat-label">Current Attendance</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${consecutiveAbsences}</div>
            <div class="stat-label">Consecutive Absences</div>
        </div>
    </div>
    
    <h3>Student Details:</h3>
    <p><strong>Name:</strong> ${studentName}<br>
    <strong>Roll Number:</strong> ${rollNumber}<br>
    <strong>Class:</strong> ${className}</p>
    
    <h3>Required Action:</h3>
    <p>Please ensure regular attendance to avoid academic difficulties. Contact the school if there are any issues preventing regular attendance.</p>
    
    <p>For any queries, please contact the school administration.</p>
    <p>Best regards,<br>School Administration</p>
  `;
  
  return baseTemplate("Attendance Alert", content);
};

/**
 * Risk level alert email template
 */
export const riskAlertTemplate = (data) => {
  const { studentName, rollNumber, riskLevel, riskScore, riskFactors, recommendations, recipientName, recipientRole } = data;
  
  const riskClass = `risk-${riskLevel.toLowerCase()}`;
  const alertType = riskLevel === 'Critical' ? 'danger' : riskLevel === 'High' ? 'warning' : 'info';
  
  const content = `
    <h2>⚠️ Student Risk Alert</h2>
    <p>Dear ${recipientName},</p>
    
    <div class="alert alert-${alertType}">
        <strong>Risk Level Alert:</strong> ${studentName} has been identified as a <span class="${riskClass}">${riskLevel} Risk</span> student requiring immediate attention.
    </div>
    
    <h3>Student Information:</h3>
    <p><strong>Name:</strong> ${studentName}<br>
    <strong>Roll Number:</strong> ${rollNumber}<br>
    <strong>Risk Score:</strong> ${riskScore}/100</p>
    
    <h3>Risk Factors:</h3>
    <table class="table">
        <thead>
            <tr>
                <th>Factor</th>
                <th>Score</th>
                <th>Level</th>
            </tr>
        </thead>
        <tbody>
            ${riskFactors.map(factor => `
                <tr>
                    <td>${factor.name}</td>
                    <td>${factor.score}</td>
                    <td><span class="risk-${factor.level.toLowerCase()}">${factor.level}</span></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${recommendations && recommendations.length > 0 ? `
    <h3>Recommended Actions:</h3>
    <ul>
        ${recommendations.map(rec => `
            <li><strong>${rec.action}</strong> (${rec.priority} Priority)<br>
                <small>${rec.description}</small>
            </li>
        `).join('')}
    </ul>
    ` : ''}
    
    <div class="alert alert-warning">
        <strong>Immediate Action Required:</strong> Please review this student's case and implement appropriate interventions as soon as possible.
    </div>
    
    <p>Best regards,<br>Student Dropout Prevention System</p>
  `;
  
  return baseTemplate("Student Risk Alert", content);
};

/**
 * Intervention notification email template
 */
export const interventionNotificationTemplate = (data) => {
  const { interventionTitle, studentName, interventionType, status, scheduledDate, counselorName, recipientName, actionType } = data;
  
  const statusColors = {
    'Approved': 'success',
    'Pending': 'warning',
    'Rejected': 'danger',
    'Completed': 'info'
  };
  
  const alertType = statusColors[status] || 'info';
  
  const content = `
    <h2>Intervention ${actionType}</h2>
    <p>Dear ${recipientName},</p>
    
    <div class="alert alert-${alertType}">
        <strong>Intervention Update:</strong> ${interventionTitle} has been ${actionType.toLowerCase()}.
    </div>
    
    <h3>Intervention Details:</h3>
    <p><strong>Title:</strong> ${interventionTitle}<br>
    <strong>Student:</strong> ${studentName}<br>
    <strong>Type:</strong> ${interventionType}<br>
    <strong>Status:</strong> ${status}<br>
    <strong>Counselor:</strong> ${counselorName}</p>
    
    ${scheduledDate ? `<p><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleDateString()}</p>` : ''}
    
    ${status === 'Approved' ? `
    <div class="alert alert-success">
        <strong>Next Steps:</strong> The intervention has been approved and can now be implemented. Please coordinate with the assigned counselor for scheduling.
    </div>
    ` : ''}
    
    ${status === 'Pending' ? `
    <div class="alert alert-warning">
        <strong>Action Required:</strong> This intervention is pending approval. Please review and take appropriate action.
    </div>
    ` : ''}
    
    <p>For more details, please log into the system.</p>
    <p>Best regards,<br>Student Dropout Prevention Team</p>
  `;
  
  return baseTemplate("Intervention Notification", content);
};

/**
 * Parent meeting invitation email template
 */
export const parentMeetingTemplate = (data) => {
  const { parentName, studentName, meetingDate, meetingTime, venue, agenda, teacherName, contactNumber } = data;
  
  const content = `
    <h2>Parent Meeting Invitation</h2>
    <p>Dear ${parentName},</p>
    
    <p>You are cordially invited to attend a parent meeting to discuss ${studentName}'s academic progress and overall development.</p>
    
    <div class="alert alert-info">
        <strong>Meeting Details:</strong><br>
        <strong>Date:</strong> ${new Date(meetingDate).toLocaleDateString()}<br>
        <strong>Time:</strong> ${meetingTime}<br>
        <strong>Venue:</strong> ${venue}<br>
        <strong>Teacher:</strong> ${teacherName}
    </div>
    
    <h3>Meeting Agenda:</h3>
    <p>${agenda}</p>
    
    <h3>Student Information:</h3>
    <p><strong>Student Name:</strong> ${studentName}</p>
    
    <div class="alert alert-warning">
        <strong>Important:</strong> Your attendance is crucial for your child's academic success. Please confirm your attendance by contacting the school.
    </div>
    
    <p><strong>Contact Information:</strong><br>
    Phone: ${contactNumber}<br>
    Please call if you need to reschedule or have any questions.</p>
    
    <p>We look forward to meeting with you.</p>
    <p>Best regards,<br>School Administration</p>
  `;
  
  return baseTemplate("Parent Meeting Invitation", content);
};

/**
 * Grade report email template
 */
export const gradeReportTemplate = (data) => {
  const { studentName, rollNumber, examName, term, grades, overallPercentage, parentName, className } = data;
  
  const content = `
    <h2>Academic Performance Report</h2>
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    
    <p>Please find below the academic performance report for ${studentName}.</p>
    
    <h3>Student Information:</h3>
    <p><strong>Name:</strong> ${studentName}<br>
    <strong>Roll Number:</strong> ${rollNumber}<br>
    <strong>Class:</strong> ${className}<br>
    <strong>Exam:</strong> ${examName}<br>
    <strong>Term:</strong> ${term}</p>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${overallPercentage}%</div>
            <div class="stat-label">Overall Percentage</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${grades.filter(g => g.isPassed).length}/${grades.length}</div>
            <div class="stat-label">Subjects Passed</div>
        </div>
    </div>
    
    <h3>Subject-wise Performance:</h3>
    <table class="table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Maximum Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${grades.map(grade => `
                <tr>
                    <td>${grade.subject}</td>
                    <td>${grade.marksObtained}</td>
                    <td>${grade.maxMarks}</td>
                    <td>${grade.percentage}%</td>
                    <td>${grade.grade}</td>
                    <td style="color: ${grade.isPassed ? '#10B981' : '#EF4444'}">
                        ${grade.isPassed ? 'Pass' : 'Fail'}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${grades.some(g => !g.isPassed) ? `
    <div class="alert alert-warning">
        <strong>Areas for Improvement:</strong> Please focus on subjects where performance needs improvement. Consider additional study time or tutoring if needed.
    </div>
    ` : `
    <div class="alert alert-success">
        <strong>Excellent Performance:</strong> ${studentName} has performed well across all subjects. Keep up the good work!
    </div>
    `}
    
    <p>For any queries regarding the results, please contact the school.</p>
    <p>Best regards,<br>Academic Department</p>
  `;
  
  return baseTemplate("Academic Performance Report", content);
};

/**
 * Weekly progress report email template
 */
export const weeklyProgressTemplate = (data) => {
  const { studentName, weekStartDate, weekEndDate, attendanceData, behaviorNotes, achievements, parentName } = data;
  
  const content = `
    <h2>Weekly Progress Report</h2>
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    
    <p>Here's ${studentName}'s progress report for the week of ${new Date(weekStartDate).toLocaleDateString()} to ${new Date(weekEndDate).toLocaleDateString()}.</p>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${attendanceData.present}</div>
            <div class="stat-label">Days Present</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${attendanceData.absent}</div>
            <div class="stat-label">Days Absent</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${attendanceData.percentage}%</div>
            <div class="stat-label">Attendance Rate</div>
        </div>
    </div>
    
    ${behaviorNotes && behaviorNotes.length > 0 ? `
    <h3>Behavior & Participation:</h3>
    <ul>
        ${behaviorNotes.map(note => `<li>${note}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${achievements && achievements.length > 0 ? `
    <h3>🏆 Achievements This Week:</h3>
    <ul>
        ${achievements.map(achievement => `<li>${achievement}</li>`).join('')}
    </ul>
    ` : ''}
    
    <div class="alert alert-info">
        <strong>Keep it up!</strong> Regular attendance and active participation are key to academic success.
    </div>
    
    <p>Thank you for your continued support in ${studentName}'s education.</p>
    <p>Best regards,<br>Class Teacher</p>
  `;
  
  return baseTemplate("Weekly Progress Report", content);
};

/**
 * System maintenance notification template
 */
export const maintenanceNotificationTemplate = (data) => {
  const { maintenanceDate, startTime, endTime, duration, reason, alternativeAccess } = data;
  
  const content = `
    <h2>🔧 Scheduled System Maintenance</h2>
    <p>Dear User,</p>
    
    <p>We will be performing scheduled maintenance on the Student Dropout Prevention System to improve performance and add new features.</p>
    
    <div class="alert alert-warning">
        <strong>Maintenance Schedule:</strong><br>
        <strong>Date:</strong> ${new Date(maintenanceDate).toLocaleDateString()}<br>
        <strong>Time:</strong> ${startTime} - ${endTime}<br>
        <strong>Duration:</strong> ${duration}<br>
        <strong>Reason:</strong> ${reason}
    </div>
    
    <h3>What to Expect:</h3>
    <ul>
        <li>The system will be temporarily unavailable during the maintenance window</li>
        <li>All data will be preserved and secure</li>
        <li>You may experience brief interruptions before and after the scheduled time</li>
    </ul>
    
    ${alternativeAccess ? `
    <h3>Alternative Access:</h3>
    <p>${alternativeAccess}</p>
    ` : ''}
    
    <div class="alert alert-info">
        <strong>We apologize for any inconvenience</strong> and appreciate your patience as we work to improve your experience.
    </div>
    
    <p>If you have any urgent matters, please contact your system administrator.</p>
    <p>Best regards,<br>Technical Support Team</p>
  `;
  
  return baseTemplate("System Maintenance Notification", content);
};

/**
 * Achievement celebration email template
 */
export const achievementTemplate = (data) => {
  const { studentName, achievementType, description, date, teacherName, parentName } = data;
  
  const content = `
    <h2>🎉 Celebrating Achievement!</h2>
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    
    <p>We are delighted to share some wonderful news about ${studentName}!</p>
    
    <div class="alert alert-success">
        <strong>🏆 Achievement Unlocked!</strong><br>
        ${studentName} has achieved: <strong>${achievementType}</strong>
    </div>
    
    <h3>Achievement Details:</h3>
    <p><strong>Type:</strong> ${achievementType}<br>
    <strong>Description:</strong> ${description}<br>
    <strong>Date:</strong> ${new Date(date).toLocaleDateString()}<br>
    <strong>Recognized by:</strong> ${teacherName}</p>
    
    <div class="alert alert-info">
        <strong>Congratulations!</strong> This achievement reflects ${studentName}'s hard work, dedication, and positive attitude. We are proud of this accomplishment!
    </div>
    
    <p>Please join us in celebrating this success and encouraging ${studentName} to continue striving for excellence.</p>
    
    <p>Best regards,<br>School Faculty</p>
  `;
  
  return baseTemplate("Achievement Celebration", content);
};

export default {
  baseTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  attendanceAlertTemplate,
  riskAlertTemplate,
  interventionNotificationTemplate,
  parentMeetingTemplate,
  gradeReportTemplate,
  weeklyProgressTemplate,
  maintenanceNotificationTemplate,
  achievementTemplate
};