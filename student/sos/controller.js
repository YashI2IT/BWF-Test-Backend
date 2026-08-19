const { sendEmergencyEmail } = require('./service');
const Student = require('../models/student');
const SOSAlert = require('../../models/SOSAlert');

async function triggerSOS(req, res) {
    try {
        const { message, createdAt } = req.body;

        // Extract student auth_id from the authenticated token
        const auth_id = req.user?.auth_id;

        if (!auth_id) {
            return res.status(401).json({ message: "Student authentication required" });
        }

        // Fetch student details for enriched email
        const student = await Student.findOne({ auth_id }).lean();
        const studentDetails = {
            name: student ? student.name : 'Unknown',
            phone: student ? student.contactNumber : 'N/A',
            classInfo: student ? student.class : 'N/A'
        };

        // Log locally for immediate server-side visibility
        console.log(`[SOS TRIGGERED] Student: ${studentDetails.name} (${auth_id}), Message: ${message}`);

        // Trigger the email service
        await sendEmergencyEmail(auth_id, { message, createdAt, ...studentDetails });

        const WardenComplaint = require('../../warden/models/complaints');
        
        // Save SOS Alert to database for Admin portal
        await SOSAlert.create({
            auth_id,
            studentName: studentDetails.name,
            message: message || "Student requested immediate help from SOS button.",
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            status: 'unread'
        });

        // ALSO log this as a High-Priority Complaint so it appears in the Admin Complaints dashboard
        console.log(`[SOS DEBUG] Preparing WardenComplaint. Has student? ${!!student}. userId? ${student?.userId}. hostelName? ${student?.hostelName}`);
        
        if (student && student.userId && student.hostelName) {
            const now = createdAt ? new Date(createdAt) : new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            try {
                await WardenComplaint.create({
                    title: "EMERGENCY SOS ALERT",
                    description: message || "Student requested immediate help from SOS button.",
                    reporter: `${studentDetails.name} (Student)`,
                    role: 'student',
                    date: now,
                    time: timeString,
                    location: 'Emergency SOS',
                    priority: 'High',
                    status: 'OPEN',
                    timeline: {
                        reportedDate: now,
                        reportedTime: timeString
                    },
                    creator: student.userId,
                    hostelName: student.hostelName
                });
                console.log(`[SOS DEBUG] Successfully created WardenComplaint for SOS`);
            } catch (createErr) {
                console.error(`[SOS DEBUG] Error creating WardenComplaint:`, createErr);
            }
        } else {
            console.log(`[SOS DEBUG] Skipping WardenComplaint creation because student missing userId or hostelName.`);
        }

        return res.status(200).json({
            success: true,
            message: "SOS Alert successfully escalated to administration"
        });
    } catch (error) {
        console.error('SOS_CONTROLLER_ERROR:', error);
        return res.status(500).json({ message: "Server error while processing emergency alert" });
    }
}

module.exports = { triggerSOS };
