const express = require("express");
const dotenv = require("dotenv");
const app = express();



dotenv.config();

const db = require("./config/db");

const userRoutesV1 = require("./routes/V1/userRoutes");
const taskRoutesV1 = require("./routes/V1/taskRoutes");
const authRoutesV1 = require("./routes/V1/authRoutes");

// Import (V2)
// const taskRoutesV2 = require('./routes/V2/taskRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Mini Task API Running...");
});

app.use("/api/V1/users", userRoutesV1);
app.use("/api/V1/tasks", taskRoutesV1);
app.use("/api/V1/auth", authRoutesV1);

app.use((req, res, next) => {
  const err = new Error("Endpoint not found");
  err.statusCode = 404;
  err.code = "NOT_FOUND";
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
