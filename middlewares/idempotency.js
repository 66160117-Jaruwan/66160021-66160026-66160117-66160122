const db = require("../config/db");
const crypto = require("crypto");

// 24 ชั่วโมง (in milliseconds)
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

// ฟังก์ชันสำหรับ Hash key (เพื่อความปลอดภัย, ไม่เก็บ Key ดิบๆ)
function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function idempotencyMiddleware() {
  return async (req, res, next) => {
    // (ตามสเปค) เราสนใจเฉพาะ POST /tasks
    // (ถ้าไม่ใช่ POST -> ปล่อยผ่าน)
    // (นี่คือสาเหตุที่ 'PATCH' (จาก routes/v2) ใช้งานได้ แม้จะเรียกใช้ Middleware นี้)
    if (req.method !== "POST") {
      return next();
    }

    // 1. (สเปค) ดึง Key และ User ID
    const idempotencyKey = req.headers["idempotency-key"];
    const userId = req.user.id; // (มาจาก authenticate.js)

    // 2. (สเปค) ถ้าเป็น POST (ที่เราสนใจ) ต้องมี Key
    if (!idempotencyKey) {
      const err = new Error(
        "Idempotency-Key header is required for this request"
      );
      err.statusCode = 400;
      err.code = "IDEMPOTENCY_KEY_MISSING";
      return next(err);
    }

    const keyHash = hashKey(idempotencyKey);

    try {
      // 3. (สเปค) ค้นหา Key ใน DB (จากตารางที่เราเพิ่งสร้าง)
      const [rows] = await db.query(
        "SELECT * FROM idempotency_keys WHERE key_hash = ? AND user_id = ?",
        [keyHash, userId]
      );

      if (rows.length > 0) {
        const cached = rows[0];

        // 4. (สเปค) เช็ควันหมดอายุ (24 ชม.)
        const ageMs = new Date() - new Date(cached.created_at);

        if (ageMs < EXPIRATION_MS) {
          // 5. (สเปค) ถ้า Key ซ้ำ (และไม่หมดอายุ) -> return response เดิม
          if (cached.response_body) {
            return res
              .status(cached.status_code)
              .json(JSON.parse(cached.response_body));
          } else {
            // (กรณี: Request ก่อนหน้ายัง "Pending")
            const err = new Error(
              "Request with this key is already in progress"
            );
            err.statusCode = 429; // (429 Too Many Requests)
            err.code = "IDEMPOTENCY_IN_PROGRESS";
            return next(err);
          }
        } else {
          // (ถ้าหมดอายุ) ลบของเก่าทิ้ง (เดี๋ยวจะสร้างใหม่)
          await db.query(
            "DELETE FROM idempotency_keys WHERE key_hash = ? AND user_id = ?",
            [keyHash, userId]
          );
        }
      }

      // 6. (สเปค) ถ้า Key ใหม่ -> "ดัก" Response

      // (a) บันทึกว่า "กำลังทำ" (ยังไม่มี Response)
      await db.query(
        "INSERT INTO idempotency_keys (key_hash, user_id, created_at) VALUES (?, ?, NOW())",
        [keyHash, userId]
      );

      // (b) "ดัก" res.json (นี่คือส่วนที่ซับซ้อน)
      const originalJson = res.json;
      const originalStatus = res.status;

      let statusCode = 200; // default
      let responseBody = null;

      // "Monkey-patch" res.status (ดัก status code)
      res.status = (code) => {
        statusCode = code;
        return originalStatus.call(res, code); // เรียกของเดิม
      };

      // "Monkey-patch" res.json (ดัก response body)
      res.json = (body) => {
        responseBody = body; // ดัก Body
        return originalJson.call(res, body); // เรียกของเดิม
      };

      // (c) เมื่อ Controller (createTask) ทำงาน "เสร็จ"
      // -> อัปเดต DB ด้วย Response ที่ "ดัก" มาได้
      res.once("finish", async () => {
        try {
          if (responseBody) {
            await db.query(
              "UPDATE idempotency_keys SET response_body = ?, status_code = ? WHERE key_hash = ? AND user_id = ?",
              [JSON.stringify(responseBody), statusCode, keyHash, userId]
            );
          }
        } catch (dbError) {
          console.error("Failed to cache idempotency response:", dbError);
        }
      });

      next();
    } catch (error) {
      next(error); // ส่ง Error ไปที่ errorHandler
    }
  };
}

module.exports = idempotencyMiddleware;
