const db = require("../../config/db");
const bcrypt = require("bcrypt");

// --- (A) User Endpoints (/me) ---
exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      const err = new Error("User not found (from getMe)");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { id } = req.user; // (ID จาก Token)
    const { name, email } = req.body;
    if (!name || !email) {
      const err = new Error("Name and email are required");
      err.statusCode = 400;
      err.code = "MISSING_FIELDS";
      return next(err);
    }

    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, id]
    );

    if (result.affectedRows === 0) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    // (เช็ค Error พิเศษ: ถ้า Email ซ้ำ)
    if (error.code === "ER_DUP_ENTRY") {
      const err = new Error("This email is already in use.");
      err.statusCode = 409;
      err.code = "EMAIL_EXISTS";
      return next(err);
    }
    next(error);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    const { id } = req.user; // (ID จาก Token)

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// --- (B) Admin Endpoints (/) ---
exports.getAllUsers = async (req, res, next) => {
  try {
    const [users] = await db.query(
      "SELECT id, email, name, role, isPremium, createdAt FROM users"
    );
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      "SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }
    res.status(200).json(users[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isPremium } = req.body;

    if (!name || !email || !role) {
      const err = new Error("Name, email, and role are required");
      err.statusCode = 400;
      err.code = "MISSING_FIELDS";
      return next(err);
    }

    await db.query(
      "UPDATE users SET name = ?, email = ?, role = ?, isPremium = ? WHERE id = ?",
      [name, email, role, isPremium || false, id]
    );

    res.status(200).json({ message: "User updated successfully (by Admin)" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const err = new Error("This email is already in use.");
      err.statusCode = 409;
      err.code = "EMAIL_EXISTS";
      return next(err);
    }
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ message: "User deleted successfully (by Admin)" });
  } catch (error) {
    next(error);
  }
};
