// utils/mailer.js
// Nodemailer utility — sends email alerts for SoS grievances.
// Config via .env: EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use a Gmail App Password, not your real password
  },
});

/**
 * Send an SoS alert email to the admin.
 * @param {Object} grievance - The grievance document
 */
async function sendSoSAlert(grievance) {
  if (!process.env.EMAIL_USER || !process.env.ADMIN_EMAIL) {
    console.warn('[mailer] Email not configured — skipping SoS alert email.');
    return false;
  }

  const priorityLabel = grievance.type === 'sos' ? '🚨 SOS ALERT' : '🆘 Help Request';
  const subject = `${priorityLabel} — ${grievance.subject} (${grievance.home || 'BWF'})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${grievance.type === 'sos' ? '#dc2626' : '#d97706'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${priorityLabel}</h2>
        <p style="margin: 4px 0 0; opacity: 0.9;">BWF Portal Grievance System</p>
      </div>
      <div style="background: #fafaf9; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 140px;">Submitted by</td><td style="font-weight: 600;">${grievance.submittedBy}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Role</td><td style="text-transform: capitalize;">${grievance.role}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Home</td><td>${grievance.home || '—'}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Priority</td><td style="font-weight: 600; color: #dc2626;">${grievance.priority?.toUpperCase()}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Subject</td><td style="font-weight: 600;">${grievance.subject}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Time</td><td>${new Date(grievance.createdAt).toLocaleString('en-IN')}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">MESSAGE</p>
          <p style="margin: 0; color: #1f2937; line-height: 1.6;">${grievance.message}</p>
        </div>
        <a href="http://localhost:3000/admin/grievances" 
           style="display: inline-block; margin-top: 20px; background: #8c6d4f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View in Admin Portal →
        </a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"BWF Portal" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
    return false;
  }
}

module.exports = { sendSoSAlert };
