const Task = require("../../models/taskModel");
const db = require("../../config/db");

// Helper function สำหรับ v1 response (basic fields only)
const formatTaskV1 = (task) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    assignedTo: task.assignedTo,
    isPublic: task.isPublic,
  };
};

// ดึงงานทั้งหมด
exports.getAllTasks = async (req, res) => {
  Task.getAll((err, results) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve tasks",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Format เป็น v1 response
    const tasks = results.map(formatTaskV1);
    res.json(tasks);
  });
};

// ดึงงานตาม id
exports.getTaskById = async (req, res) => {
  const { id } = req.params;

  Task.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve task",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Task not found",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    res.json(formatTaskV1(results[0]));
  });
};

// สร้างงานใหม่
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, assignedTo, isPublic } = req.body;
    const ownerId = req.user ? req.user.id : null;

    if (!ownerId) {
      return res
        .status(401)
        .json({ error: "Missing user info, please login again" });
    }

    const newTask = await Task.create({
      title,
      description,
      priority,
      ownerId,
      assignedTo,
      isPublic,
    });

    res.status(201).json({ data: newTask });
  } catch (err) {
    next(err);
  }
};

// อัปเดตงาน
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  Task.update(id, data, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update task",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Task not found",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    res.json({ message: "Task updated successfully" });
  });
};

// ลบงาน
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  Task.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete task",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Task not found",
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    res.json({ message: "Task deleted successfully" });
  });
};