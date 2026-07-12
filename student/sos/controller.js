const { sendEmergencyEmail } = require('./service');
const Student = require('../models/student');

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
