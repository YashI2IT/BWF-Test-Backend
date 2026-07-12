const TeacherSchedule = require('../models/schedule');
const { uploadToCloudinary } = require('../../utils/cloudinary');

// @route   GET /teacher/schedule
// @desc    Get all schedule items for the logged-in teacher
exports.getSchedule = async (req, res) => {
  try {
    const schedules = await TeacherSchedule.find({ teacherId: req.user.id }).sort({ date: 1, startTime: 1 });
    res.json(schedules);
  } catch (error) {
    console.error('Error in getSchedule:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   POST /teacher/schedule
// @desc    Create a new schedule item
exports.createSchedule = async (req, res) => {
  try {
    const { title, type, date, startTime, endTime, description, joinLink } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Please provide title, date, start time, and end time' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, file.mimetype);
          attachments.push({
            name: file.originalname,
            url: result.url,
            type: file.mimetype
          });
        } catch (uploadError) {
          console.error("Cloudinary upload failed:", uploadError);
          return res.status(500).json({ error: 'Failed to upload attachment' });
        }
      }
    }

    const newSchedule = new TeacherSchedule({
      teacherId: req.user.id,
      title,
      type,
      date,
      startTime,
      endTime,
      description,
      joinLink,
      attachments
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error in createSchedule:', error);
    require('fs').appendFileSync('debug.log', new Date().toISOString() + ' - Error in createSchedule: ' + error.stack + '\n');
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @route   PUT /teacher/schedule/:id
// @desc    Update an existing schedule item
exports.updateSchedule = async (req, res) => {
  try {
    const { title, type, date, startTime, endTime, description, joinLink } = req.body;
    
    let schedule = await TeacherSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.teacherId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    schedule.title = title || schedule.title;
    schedule.type = type || schedule.type;
    schedule.date = date || schedule.date;
    schedule.startTime = startTime || schedule.startTime;
    schedule.endTime = endTime || schedule.endTime;
    schedule.description = description !== undefined ? description : schedule.description;
    schedule.joinLink = joinLink !== undefined ? joinLink : schedule.joinLink;

    await schedule.save();
    res.json(schedule);
  } catch (error) {
    console.error('Error in updateSchedule:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   DELETE /teacher/schedule/:id
// @desc    Delete a schedule item
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await TeacherSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.teacherId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await TeacherSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule removed' });
  } catch (error) {
    console.error('Error in deleteSchedule:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   POST /teacher/schedule/:id/comments
// @desc    Add a comment to a schedule
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const schedule = await TeacherSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // req.user might be an object from authenticateToken. 
    // Usually req.user has _id, name, avatar.
    const newComment = {
      user: req.user.id || req.user._id,
      name: req.user.name || 'Teacher',
      avatar: req.user.avatar || '',
      text,
      createdAt: new Date()
    };

    schedule.comments.push(newComment);
    await schedule.save();

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
