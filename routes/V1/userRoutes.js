const express = require("express");
const router = express.Router();
const userController = require("../../controllers/V1/userController");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.get("/me", authenticate, userController.getMe);
router.put("/me", authenticate, userController.updateMe);
router.delete("/me", authenticate, userController.deleteMe);

router.get("/", authenticate, authorize(["admin"]), userController.getAllUsers);
router.get(
  "/:id",
  authenticate,
  authorize(["admin"]),
  userController.getUserById
);
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  userController.updateUser
);
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  userController.deleteUser
);

module.exports = router;
