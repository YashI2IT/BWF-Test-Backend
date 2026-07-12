const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
//using someshsinha902@gmail.com for testing , change before sending to production ; 
/**
 * Sends an emergency SOS email to the BWF Administration.
 * @param {string} studentId - The auth_id of the student.
 * @param {Object} details - The emergency details (message, createdAt, name, phone, classInfo).
 */
async function sendEmergencyEmail(studentId, details) {
    // 1. Define the directory path separately first
    const logDir = path.join(__dirname, '../logs');
    const logFilePath = path.join(logDir, 'emergencies.log');

    // 2. Ensure the logs folder exists so the server doesn't crash
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const formattedTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium', 
        timeStyle: 'short',
        hour12: true
    });
    const logEntry = `[${formattedTime}] SOS ALERT - Student: ${details.name} (${studentId}), Phone: ${details.phone}, Message: ${details.message}\n`;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true, // Fixed for Port 465 SSL
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"BWF Emergency System" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL || 'someshsinha902@gmail.com',
            //just for testing , change the alternative email before shipping to production 
            subject: `🚨 URGENT SOS ALERT - ${details.name}`,
            text: `Emergency Alert Triggered!\n\nStudent: ${details.name}\nStudent ID: ${studentId}\nPhone: ${details.phone}\nClass: ${details.classInfo}\nMessage: ${details.message}\nTime: ${formattedTime}\n\nImmediate action is required.`,
            html: `
                <div style="font-family: sans-serif; border: 2px solid #ef4444; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #ef4444;">🚨 URGENT SOS ALERT</h2>
                    <p><strong>Student Name:</strong> ${details.name}</p>
                    <p><strong>Student ID:</strong> ${studentId}</p>
                    <p><strong>Phone:</strong> ${details.phone}</p>
                    <p><strong>Class:</strong> ${details.classInfo}</p>
                    <p><strong>Message:</strong> ${details.message}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <hr />
                    <p style="color: #4b5563;">This is a direct escalation to BWF Administration.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SOS EMAIL SENT] to ${mailOptions.to}`);

    } catch (error) {
        console.error('SOS_EMAIL_ERROR:', error);
        // Fail-safe: log to file if email fails
        fs.appendFileSync(logFilePath, logEntry);
        console.error(`[SOS FAIL-SAFE] Emergency logged to ${logFilePath}`);
    }
}

module.exports = { sendEmergencyEmail };
