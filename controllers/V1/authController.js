const User = require('../../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// 1. ลงทะเบียนผู้ใช้ใหม่
exports.register = (req, res) => {
  const { email, password, name } = req.body;

  // 1. ตรวจสอบข้อมูล
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'All fields are required (email, password, name)' });
  }

  // 2. ตรวจสอบว่า email นี้ถูกใช้ไปแล้วหรือยัง
  User.checkEmailExists(email, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) {
      return res.status(409).json({ message: 'This email is already in use.' });
    }

    // 3. ถ้ายังไม่ถูกใช้ -> แฮชรหัสผ่าน
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) return res.status(500).json({ error: hashErr.message });

      const newUser = {
        email,
        password: hashedPassword,
        name
        // role, isPremium ฯลฯ จะใช้ค่า default จาก Model
      };

      // 4. สร้างผู้ใช้ในฐานข้อมูล
      User.create(newUser, (createErr, result) => {
        if (createErr) return res.status(500).json({ error: createErr.message });
        
        // ส่ง response กลับไป (ไม่ส่ง password hash)
        res.status(201).json({ 
          message: 'User registered successfully',
          userId: result.insertId,
          email: newUser.email,
          name: newUser.name
        });
      });
    });
  });
};

// 2. ล็อกอิน
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // 1. ค้นหาผู้ใช้ด้วย email (Model จะส่ง password hash กลับมาด้วย)
  User.getByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      // ไม่พบผู้ใช้
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    // 2. เปรียบเทียบรหัสผ่านที่ส่งมา กับ hash ในฐานข้อมูล
    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr) return res.status(500).json({ error: compareErr.message });
      if (!isMatch) {
        // รหัสผ่านไม่ตรง
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // 3. ถ้าตรง -> สร้าง Tokens
      const userPayload = { id: user.id, email: user.email, role: user.role };

      const accessToken = jwt.sign(
        userPayload,
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' } // Access Token อายุสั้น
      );

      const refreshToken = jwt.sign(
        { id: user.id }, // Refresh Token เก็บแค่ ID
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' } // Refresh Token อายุยาว
      );

      // 4. ส่ง Token กลับไป
      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken
      });
    });
  });
};

// 3. ขอ Access Token ใหม่ (ด้วย Refresh Token)
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  // 1. ตรวจสอบ Refresh Token
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // Token ผิดพลาด หรือ หมดอายุ
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // 2. ถ้า Token ถูกต้อง (decoded จะมี { id: ... })
    // เราควรดึงข้อมูล user อีกครั้ง เพื่อความปลอดภัย (เผื่อ role เปลี่ยน)
    User.getById(decoded.id, (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: userErr.message });
      if (userResults.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = userResults[0];

      // 3. สร้าง Access Token ใหม่
      const userPayload = { id: user.id, email: user.email, role: user.role };
      const newAccessToken = jwt.sign(
        userPayload,
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });
  });
};

// 4. ล็อกเอาท์
exports.logout = (req, res) => {
  const { refreshToken } = req.body;

  // --- (สำหรับระบบที่สมบูรณ์) ---
  // ในระบบที่สมบูรณ์ เราจะเก็บ Refresh Token ไว้ใน
  // "Blocklist" (เช่น ใน Redis หรือ Database)
  // เพื่อไม่ให้ Token นี้ถูกนำมาใช้ขอ Access Token ใหม่ได้อีก
  // ------------------------------

  // สำหรับตอนนี้ (Stateless)
  // การ logout จริงๆ จะเกิดขึ้นที่ฝั่ง Client (ลบ Token ทิ้ง)
  // Server แค่ตอบรับว่า "โอเค"
  res.status(200).json({ message: 'Logout successful. Client should discard tokens.' });
};