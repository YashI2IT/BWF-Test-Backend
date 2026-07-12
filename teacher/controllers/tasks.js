const Task = require('../../student/models/Task');
const { uploadToCloudinary } = require('../../utils/cloudinary');

// ===== ACTIVITIES / TASKS =====
async function getTasks(req, res) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
}

async function createTask(req, res) {
  try {
    const { title, description, dueDate, assignedTo } = req.body;
    
    let fileUrl = null;
    let fileType = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        fileUrl = result.url;
        fileType = result.type;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    }

    const task = await Task.create({ title, description, dueDate, assignedTo, fileUrl, fileType });
    return res.status(201).json({ message: "Task assigned", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
}

async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { title, description, dueDate, assignedTo } = req.body;
    
    let updateData = { title, description, dueDate, assignedTo };

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        updateData.fileUrl = result.url;
        updateData.fileType = result.type;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    }
    
    const task = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );
    
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.status(200).json({ message: "Task updated", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
}

async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.status(200).json({ message: "Task deleted", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
}

async function verifyTask(req, res) {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndUpdate(taskId, { status: 'verified' }, { new: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.status(200).json({ message: "Task verified", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
}



module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  verifyTask
};
