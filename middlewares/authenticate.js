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

    const [users] = await db.query(
      `SELECT id, email, name, role, isPremium AS isPremium,
              subscription_expiry AS subscriptionExpiry,
              created_at AS createdAt
       FROM users
       WHERE id = ?`,
      [decoded.userId || decoded.id]
    );

    if (users.length === 0) {
      const err = new Error("User not found");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }
    const user = users[0];
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
