const express = require('express');
const router = express.Router();

// router สำหรับ API V2
router.get('/', (req, res) => {
  res.json({
    message: '🚀 Task API v2 endpoint ready',
    metadata: {
      version: 'v2',
      timestamp: new Date().toISOString(),
      note: 'ยังไม่มีฟังก์ชัน controller — จะเพิ่มภายหลัง'
    }
  });
});

module.exports = router;
