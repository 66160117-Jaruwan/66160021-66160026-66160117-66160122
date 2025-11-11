const Task = require('../../models/taskModel');

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
    isPublic: task.isPublic
  };
};

// ดึงงานทั้งหมด
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
    
    // Format เป็น v1 response
    const tasks = results.map(formatTaskV1);
    res.json(tasks);
  });
};

// ดึงงานตาม id
exports.getTaskById = (req, res) => {
  const { id } = req.params;
  
  Task.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve task',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    res.json(formatTaskV1(results[0]));
  });
};

// สร้างงานใหม่
exports.createTask = (req, res) => {
  const data = req.body;
  
  // Validation
  if (!data.title) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: {
          title: 'Title is required'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
  
  Task.create(data, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create task',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    res.status(201).json(formatTaskV1({ id: result.insertId, ...data }));
  });
};

// อัปเดตงาน
exports.updateTask = (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  Task.update(id, data, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update task',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    res.json({ message: 'Task updated successfully' });
  });
};

// ลบงาน
exports.deleteTask = (req, res) => {
  const { id } = req.params;
  
  Task.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete task',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    res.json({ message: 'Task deleted successfully' });
  });
};