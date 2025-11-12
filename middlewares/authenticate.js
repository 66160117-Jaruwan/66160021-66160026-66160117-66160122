const jwt = require("jsonwebtoken");
const db = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || process.env.ACCESS_TOKEN_SECRET;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("No token provided");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (verifyErr) {
      const err = new Error(
        verifyErr.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid token"
      );
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    // ⭐️ (Bug 2 แก้ไข) อิงตาม "User Attributes" ที่คุณส่งมา:
    // ⭐️ (เราต้อง SELECT "createdAt" ด้วย แต่ "ห้าม" SELECT "updatedAt")
    const [users] = await db.query(
      "SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt FROM users WHERE id = ?",

      // ⭐️ (Bug 1 แก้ไข) "Key Mismatch"
      // ⭐️ (Token ของคุณใช้ "id" ไม่ใช่ "userId")
      [decoded.id]
    );

    if (users.length === 0) {
      const err = new Error("User not found"); // (นี่คือ Error ที่คุณเจอ)
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    req.user = users[0];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
