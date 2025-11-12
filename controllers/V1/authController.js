const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");
const dotenv = require("dotenv");

dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;

// 1. ลงทะเบียนผู้ใช้ใหม่
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      const err = new Error("Email, password, and name are required");
      err.statusCode = 400;
      err.code = "MISSING_FIELDS";
      return next(err);
    }
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      err.code = "EMAIL_EXISTS";
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 10); // (อิงตามสเปค "User Attributes" - เราต้องเพิ่ม createdAt)

    const [result] = await db.query(
      "INSERT INTO users (email, password, name, role, isPremium, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, name, "user", false, new Date()]
    );

    const userPayload = {
      id: result.insertId,
      email: email,
      role: "user",
      isPremium: false,
    };
    const accessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
    });
    const refreshToken = jwt.sign(
      { id: result.insertId },
      REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// 2. ล็อกอิน
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      err.code = "MISSING_FIELDS";
      return next(err);
    }

    const [results] = await db.query(
      "SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt, password FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      err.code = "INVALID_CREDENTIALS";
      return next(err);
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      err.code = "INVALID_CREDENTIALS";
      return next(err);
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    };

    const accessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
    });

    const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
      
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const err = new Error("Refresh token is required");
      err.statusCode = 400;
      err.code = "MISSING_TOKEN";
      return next(err);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (jwtErr) {
      const err = new Error("Invalid or expired refresh token");
      err.statusCode = 401;
      err.code = "INVALID_TOKEN";
      return next(err);
    }

    if (!decoded.id) {
      const err = new Error("Invalid refresh token payload");
      err.statusCode = 401;
      err.code = "INVALID_TOKEN";
      return next(err);
    }

    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      decoded.id,
    ]);

    if (users.length === 0) {
      const err = new Error("User not found for this token");
      err.statusCode = 401;
      err.code = "USER_NOT_FOUND";
      return next(err);
    }
    const user = users[0]; // สร้าง access token ใหม่

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    };

    const newAccessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
    });

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};
