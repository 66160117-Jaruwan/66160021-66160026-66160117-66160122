const authorize = require("../../middlewares/authorize");
const checkPremiumFeature = require("../../middlewares/checkPremiumFeature");
const checkTaskAccess = require("../../middlewares/checkTaskAccess");

// 1. ใช้ checkPremiumFeature ตอน "สร้าง"
router.post(
  "/",
  authenticate,
  idempotencyMiddleware(),
  checkPremiumFeature, // ⬅️ ใช้งานตรงนี้
  taskController.createTask
);

// 2. ใช้ checkTaskAccess ตอน "อ่าน", "แก้", "ลบ"
router.get(
  "/:id",
  authenticate,
  checkTaskAccess("read"), // ⬅️ ใช้งานตรงนี้
  taskController.getTaskById
);

router.delete(
  "/:id",
  authenticate,
  checkTaskAccess("delete"), // ⬅️ ใช้งานตรงนี้
  taskController.deleteTask
);

// ใช้ authorize ตอน "เรียกดู user ทั้งหมด" (ใน userRoutes.js)
// router.get("/users", authenticate, authorize(['admin']), ...);
