const db = require('../config/db');

// Task Model (CRUD + Query)
const Task = {
  // ดึงทั้งหมด (รองรับ filtering สำหรับสัปดาห์ 3)
  getAll: (filters = {}, callback) => {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    // Filtering (สำหรับสัปดาห์ 3)
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.assignedTo) {
      query += ' AND assignedTo = ?';
      params.push(filters.assignedTo);
    }

    if (filters.ownerId) {
      query += ' AND ownerId = ?';
      params.push(filters.ownerId);
    }

    if (filters.isPublic !== undefined) {
      query += ' AND isPublic = ?';
      params.push(filters.isPublic);
    }

    // Sorting (สำหรับสัปดาห์ 3)
    if (filters.sort) {
      const [field, order] = filters.sort.split(':');
      const validFields = ['createdAt', 'updatedAt', 'priority', 'status'];
      const validOrders = ['asc', 'desc'];
      
      if (validFields.includes(field) && validOrders.includes(order?.toLowerCase())) {
        query += ` ORDER BY ${field} ${order.toUpperCase()}`;
      }
    } else {
      query += ' ORDER BY createdAt DESC'; // default sorting
    }

    // Pagination (สำหรับสัปดาห์ 3)
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 10;
      const page = parseInt(filters.page) || 1;
      const offset = (page - 1) * limit;
      
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    db.query(query, params, callback);
  },

  // ดึงตาม id
  getById: (id, callback) => {
    db.query('SELECT * FROM tasks WHERE id = ?', [id], callback);
  },

  // ดึงตาม ownerId (สำหรับ ABAC)
  getByOwnerId: (ownerId, callback) => {
    db.query('SELECT * FROM tasks WHERE ownerId = ?', [ownerId], callback);
  },

  // ดึง public tasks (สำหรับ ABAC)
  getPublicTasks: (callback) => {
    db.query('SELECT * FROM tasks WHERE isPublic = true', callback);
  },

  // ดึง tasks ที่ user ถูก assign (สำหรับ ABAC)
  getByAssignee: (userId, callback) => {
    db.query('SELECT * FROM tasks WHERE assignedTo = ?', [userId], callback);
  },

  // สร้าง task ใหม่
  create: (data, callback) => {
    // Set default values
    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      ownerId: data.ownerId,
      assignedTo: data.assignedTo || null,
      isPublic: data.isPublic !== undefined ? data.isPublic : false
    };

    db.query('INSERT INTO tasks SET ?', taskData, callback);
  },

  // อัปเดต task (full update)
  update: (id, data, callback) => {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    db.query('UPDATE tasks SET ? WHERE id = ?', [updateData, id], callback);
  },

  // อัปเดต status เฉพาะ (สำหรับ PATCH /tasks/:id/status)
  updateStatus: (id, status, callback) => {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return callback(new Error('Invalid status'));
    }

    db.query(
      'UPDATE tasks SET status = ?, updatedAt = NOW() WHERE id = ?',
      [status, id],
      callback
    );
  },

  // ลบ task
  delete: (id, callback) => {
    db.query('DELETE FROM tasks WHERE id = ?', [id], callback);
  },

  // นับจำนวน tasks (สำหรับ pagination)
  count: (filters = {}, callback) => {
    let query = 'SELECT COUNT(*) as total FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.ownerId) {
      query += ' AND ownerId = ?';
      params.push(filters.ownerId);
    }

    if (filters.isPublic !== undefined) {
      query += ' AND isPublic = ?';
      params.push(filters.isPublic);
    }

    db.query(query, params, callback);
  }
};

module.exports = Task;