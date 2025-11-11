const express = require('express');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

const db = require('./config/db');

// Import v1 routes
const userRoutesV1 = require('./routes/V1/userRoutes');
const taskRoutesV1 = require('./routes/V1/taskRoutes');
const authRoutesV1 = require('./routes/V1/authRoutes');

// Import v2 routes (เพื่อนจะสร้างทีหลัง)
const taskRoutesV2 = require('./routes/V2/taskRoutes');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Mini Task API Running...');
});

// API v1
app.use('/api/V1/users', userRoutesV1);
app.use('/api/V1/tasks', taskRoutesV1);
app.use('/api/V1/auth', authRoutesV1);

// API v2 (เพื่อนจะเพิ่มทีหลัง)
// app.use('/api/V2/tasks', taskRoutesV2);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});