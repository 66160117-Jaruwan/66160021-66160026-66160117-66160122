# Setup instructions
ขั้นตอนทั้งหมดเพื่อเตรียมโปรเจกต์ให้พร้อมรันและทดสอบ

## 1. โคลนโปรเจกต์ (Clone Project)

<pre>git clone <your-repository-url>
cd <your-project-directory></pre>

---

## 2. ติดตั้ง Dependencies

`npm install uuid bcrypt jsonwebtoken`

---

## 3. ตั้งค่า Environment Variables (.env)

สร้างไฟล์ `.env` ที่ Root ของโปรเจกต์ (ที่เดียวกับ `server.js`) และคัดลอกเนื้อหาด้านล่างไปวาง จากนั้นเติมค่าที่จำเป็น (โดยเฉพาะ `DB_USER`, `DB_PASS`)
## ข้อมูลโค้ด
### Server Port
`PORT=8200`

### Database (ตั้งค่าให้ตรงกับ MySQL Server ของคุณ)
<pre>DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=mini_task_mysql</pre>

### JWT Secrets (ใช้ Secret Key ที่คาดเดายาก)
<pre>JWT_ACCESS_SECRET=your_super_strong_access_secret
JWT_REFRESH_SECRET=your_even_stronger_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d</pre>

---

## 4. ตั้งค่าฐานข้อมูล (Database Setup)

ต้องมี MySQL Server รันอยู่ในเครื่องก่อน
สร้าง Database :
รัน SQL นี้เพื่อสร้างฐานข้อมูล (ชื่อต้องตรงกับ DB_NAME ใน `.env`)

`CREATE DATABASE mini_task_mysql;`


สร้างตาราง (Tables):
รัน SQL นี้ (ในฐานข้อมูล mini_task_mysql) เพื่อสร้างตาราง users และ tasks
<pre>-- สร้างตาราง users (อ้างอิงจากโครงสร้างของคุณ และแก้ไข id ให้ถูกต้อง)
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('user','premium','admin') NOT NULL DEFAULT 'user',
  isPremium TINYINT(1) DEFAULT 0,
  subscriptionExpiry DATETIME NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);</pre>

<pre>//สร้างตาราง tasks
CREATE TABLE tasks (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);</pre>

(Optional) สร้าง User Admin สำหรับทดสอบ :
เพื่อให้ผู้สอนทดสอบ API ส่วน Admin (GET /api/v1/users) ได้ทันที ให้รัน SQL นี้เพื่อสร้างบัญชี Admin (รหัสผ่านคือ adminpass)

<pre>```//รหัสผ่าน 'adminpass' ที่ถูก hash ด้วย bcrypt
INSERT INTO users (email, password, name, role) 
VALUES (
  'admin@test.com', 
  '$2a$10$8.B./Lqj.h1/mIT3K.aQx.y0.qN3.s5.r5.i3.e8.y1.i2.i', 
  'Admin', 
  'admin'
);```</pre>

สามารถใช้ POST /api/v1/auth/login ด้วย **username: "admin@test.com"** และ **password: "adminpass"** เพื่อเอา Token ของ Admin ได้ทันที

---

## 5. (สำคัญ) แก้ไข package.json (ถ้ายังไม่มี)
ตรวจสอบไฟล์ package.json ว่ามีส่วน scripts นี้หรือไม่ ถ้าไม่มีให้เพิ่มเข้าไป:

<pre>{
  "scripts": {
    "start": "node server.js"
  }
}</pre>

---

## 6. รันโปรเจกต์ (Run Project)

`npm start`

#### เซิร์ฟเวอร์จะรันที่ http://localhost:8200 (ตาม PORT ใน .env)

---
---
# features
- User & Authentication (ระบบผู้ใช้):
1. สมัครสมาชิก (Register)
2. เข้าสู่ระบบ (Login) ด้วย JWT (Access & Refresh Tokens)
3. ต่ออายุ Token (Refresh Token)
4. ออกจากระบบ (Logout)
5. ดึงข้อมูลโปรไฟล์ตัวเอง (/me)
6. แก้ไขข้อมูลโปรไฟล์ตัวเอง
7. ลบบัญชีตัวเอง
- Task Management (ระบบ Task):
1. สร้าง Task (รองรับ Idempotency-Key)
2. ดึงรายการ Task ทั้งหมด (ของตัวเอง) พร้อม Filter
3. ดึงรายละเอียด Task (ตาม ID)
4. แก้ไข Task (Full Update)
5. อัปเดตเฉพาะ Status ของ Task
6. ลบ Task
- Admin (ระบบผู้ดูแล):
1. ดึงรายชื่อผู้ใช้ทั้งหมด (Admin only)
2. Security (ความปลอดภัย):
3. เข้ารหัสรหัสผ่านด้วย bcrypt
4. ยืนยันตัวตนด้วย JWT
5. กำหนดสิทธิ์การเข้าถึง (User vs Admin)
---
---
# tech stack
- Backend: Node.js, Express.js
- Database: MySQL (เชื่อมต่อด้วย mysql2)
- Authentication: JSON Web Token (JWT)
- Password Hashing: bcrypt
- Environment Variables: dotenv