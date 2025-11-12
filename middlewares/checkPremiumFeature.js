/**
 * Middleware นี้จะตรวจสอบว่า
 * 1. User กำลังพยายามสร้าง Task ที่มี priority: 'high' หรือไม่
 * 2. ถ้าใช่, User ต้องเป็น 'premium' หรือ 'admin' เท่านั้น
 */
const checkPremiumFeature = (req, res, next) => {
  const { priority } = req.body;
  const { role, isPremium } = req.user; // (มาจาก authenticate.js)

  // 1. ถ้าไม่ได้พยายามสร้าง Task 'high' (เช่น low, medium) -> ปล่อยผ่าน
  if (priority !== "high") {
    return next();
  }

  // 2. ถ้าพยายามสร้าง 'high'...
  // (เช็ค isPremium เผื่อว่า User จ่ายเงิน แต่ยังไม่ได้ Role 'premium'
  // แต่ในสเปคนี้ เรายึด 'role' และ 'isPremium' ได้)
  if (role === "admin" || role === "premium" || isPremium === true) {
    // 3. ถ้าเป็น Admin หรือ Premium -> ปล่อยผ่าน
    return next();
  }

  // 4. ถ้าเป็น User ธรรมดา -> ห้าม
  const err = new Error(
    "Only premium members or admins can create high-priority tasks."
  );
  err.statusCode = 403; // 403 Forbidden
  err.code = "PREMIUM_FEATURE_REQUIRED";
  return next(err);
};

module.exports = checkPremiumFeature;
