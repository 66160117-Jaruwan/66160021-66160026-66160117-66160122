const rateLimit = require("express-rate-limit");

const customRateLimitHandler = (req, res, next, options) => {
  const windowMs = options.windowMs;

  // สเปคต้องการ retryAfter: 300 (5 นาที)
  const retryAfterSeconds = 300;
  const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

  res.setHeader("Retry-After", retryAfterSeconds);

  res.status(429).json({
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: `Too many requests. Try again in ${retryAfterMinutes} minutes`,
      retryAfter: retryAfterSeconds,
    },
  });
};

/**
 * 2. (สเปค) สร้างฟังก์ชัน "dynamic max"
 * นี่คือส่วนที่ "นับแต้ม" แยกตาม Role (Anonymous, User, Premium)
 */
const getMaxRequests = (req) => {
  // (Middleware นี้ต้องทำงาน "หลัง" authenticate.js เสมอ)

  // 1. Anonymous (ยังไม่ล็อกอิน)
  if (!req.user) {
    return 20;
  }

  // 2. Admin (สเปคไม่ได้บอก แต่เราควรเพิ่มให้)
  if (req.user.role === "admin") {
    return 1000;
  }

  // 3. Premium
  if (req.user.role === "premium" || req.user.isPremium === true) {
    return 500;
  }

  // 4. User (ธรรมดา)
  return 100;
};

/**
 * 3. (สเปค) สร้าง Rate Limiter หลัก
 */
const dynamicRateLimiter = rateLimit({
  // (สเปค) 15 นาที
  windowMs: 15 * 60 * 1000,

  // (สเปค) เรียกใช้ฟังก์ชัน "dynamic max"
  max: getMaxRequests,

  // (สเปค) เรียกใช้ฟังก์ชัน "handler"
  handler: customRateLimitHandler,

  // (สเปค) เปิด Response Headers (X-RateLimit-Limit, ฯลฯ)
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = dynamicRateLimiter;
