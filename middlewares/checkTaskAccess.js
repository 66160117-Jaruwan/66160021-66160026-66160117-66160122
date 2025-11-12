const db = require("../config/db"); // ต้องใช้ DB ver. Promise)

/**
 * Middleware นี้จะตรวจสอบ "ความเป็นเจ้าของ" (Ownership)
 * 1. Admin -> ผ่านหมด
 * 2. User ธรรมดา -> ต้องเช็คว่าเป็น "เจ้าของ" Task นี้หรือไม่
 * 3. (action) ที่รับค่ามา จะบอกว่ากำลังทำอะไร (read, write, delete)
 */
const checkTaskAccess = (action) => {
  return async (req, res, next) => {
    try {
      const { id: taskId } = req.params; // ID ของ Task ที่จะกระทำ
      const { id: userId, role } = req.user; // ID ของ User ที่ล็อกอิน

      // 1. Admin ผ่านทุกเงื่อนไข
      if (role === "admin") {
        return next();
      }

      // 2. ดึงข้อมูล Task เพื่อเช็ค ownerId
      const [tasks] = await db.query(
        "SELECT ownerId, isPublic FROM tasks WHERE id = ?",
        [taskId]
      );

      if (tasks.length === 0) {
        const err = new Error("Task not found");
        err.statusCode = 404;
        err.code = "NOT_FOUND";
        return next(err);
      }

      const task = tasks[0];
      const isOwner = task.ownerId === userId;

      // 3. เช็คสิทธิ์ตาม 'action'
      switch (action) {
        case "read": // (GET /:id)
          // ถ้าเป็น "เจ้าของ" หรือ Task เป็น "Public" -> ดูได้
          if (isOwner || task.isPublic) {
            return next();
          }
          break;

        case "write": // (PUT /:id)
        case "update_status": // (PATCH /:id/status)
        case "delete": // (DELETE /:id)
          // การ "แก้ไข" หรือ "ลบ" -> ต้องเป็น "เจ้าของ" เท่านั้น
          if (isOwner) {
            return next();
          }
          break;
      }

      // 4. ถ้าไม่เข้าเงื่อนไขเลย -> ไม่มีสิทธิ์
      const err = new Error(
        "You do not have permission to perform this action on this task"
      );
      err.statusCode = 403;
      err.code = "TASK_ACCESS_DENIED";
      return next(err);
    } catch (error) {
      next(error); // ส่ง Error ไปที่ errorHandler
    }
  };
};

module.exports = checkTaskAccess;
