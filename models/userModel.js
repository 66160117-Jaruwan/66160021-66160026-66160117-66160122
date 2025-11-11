const db = require('../config/db');

// User Model (CRUD + Auth)
const User = {
  // ดึงทั้งหมด
  getAll: (callback) => {
    // ไม่ส่ง password กลับไป
    db.query('SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt, updatedAt FROM users', callback);
  },

  // ดึงตาม id
  getById: (id, callback) => {
    db.query(
      'SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt, updatedAt FROM users WHERE id = ?',
      [id],
      callback
    );
  },

  // ดึงตาม email (สำหรับ login)
  getByEmail: (email, callback) => {
    // ส่ง password ด้วยเพื่อใช้ใน authentication
    db.query('SELECT * FROM users WHERE email = ?', [email], callback);
  },

  // ดึงตาม id พร้อม password (สำหรับ authentication)
  getByIdWithPassword: (id, callback) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], callback);
  },

  // สร้าง user ใหม่
  create: (data, callback) => {
    // Set default values
    const userData = {
      email: data.email,
      password: data.password, // ต้อง hash ก่อนที่ controller (สัปดาห์ 2)
      name: data.name,
      role: data.role || 'user',
      isPremium: data.isPremium || false,
      subscriptionExpiry: data.subscriptionExpiry || null
    };

    db.query('INSERT INTO users SET ?', userData, callback);
  },

  // อัปเดต user
  update: (id, data, callback) => {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    // ไม่ให้ update password ผ่าน function นี้
    delete updateData.password;
    
    db.query('UPDATE users SET ? WHERE id = ?', [updateData, id], callback);
  },

  // อัปเดต password แยก (สำหรับ change password)
  updatePassword: (id, hashedPassword, callback) => {
    db.query(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, id],
      callback
    );
  },

  // อัปเดต subscription (สำหรับ premium features)
  updateSubscription: (id, isPremium, expiryDate, callback) => {
    db.query(
      'UPDATE users SET isPremium = ?, subscriptionExpiry = ?, updatedAt = NOW() WHERE id = ?',
      [isPremium, expiryDate, id],
      callback
    );
  },

  // ตรวจสอบว่า email ซ้ำหรือไม่
  checkEmailExists: (email, callback) => {
    db.query('SELECT COUNT(*) as count FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0].count > 0);
    });
  },

  // ลบ user
  delete: (id, callback) => {
    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },

  // นับจำนวน users
  count: (callback) => {
    db.query('SELECT COUNT(*) as total FROM users', callback);
  },

  // ดึง users ตาม role (สำหรับ admin)
  getByRole: (role, callback) => {
    db.query(
      'SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt, updatedAt FROM users WHERE role = ?',
      [role],
      callback
    );
  },

  // ดึง premium users ที่ subscription หมดอายุแล้ว
  getExpiredPremiumUsers: (callback) => {
    db.query(
      'SELECT id, email, name FROM users WHERE isPremium = true AND subscriptionExpiry < NOW()',
      callback
    );
  }
};

module.exports = User;