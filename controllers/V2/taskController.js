const Task = require('../../models/taskModel');

// Helper function สำหรับ v2 response (เพิ่ม metadata)
const formatTaskV2 = (task) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    assignedTo: task.assignedTo,
    isPublic: task.isPublic,
    metadata: {
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      version: 'v2'
    }
  };
};

// TODO: เพื่อนต้องทำส่วนนี้ (copy จาก v1 แล้วเปลี่ยน format)
exports.getAllTasks = (req, res) => {
  Task.getAll((err, results) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve tasks',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    // Format เป็น v2 response (มี metadata)
    const tasks = results.map(formatTaskV2);
    res.json(tasks);
  });
};

// TODO: เหมือนกับ v1 แต่ใช้ formatTaskV2
exports.getTaskById = (req, res) => {
  // Copy จาก v1 แล้วเปลี่ยน formatTaskV1 เป็น formatTaskV2
};

exports.createTask = (req, res) => {
  // Copy จาก v1 แล้วเปลี่ยน formatTaskV1 เป็น formatTaskV2
};

exports.updateTask = (req, res) => {
  // Copy จาก v1
};

exports.deleteTask = (req, res) => {
  // Copy จาก v1
};