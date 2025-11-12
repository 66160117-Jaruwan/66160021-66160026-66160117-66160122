const authorize = (roles = []) => {
  return (req, res, next) => {
    // 1. (เช็คเผื่อ) ถ้าลืมใส่ authenticate
    if (!req.user) {
      const err = new Error("Authentication required");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err); // ⭐️ โยน Error
    }

    // 2. เช็ค Role (ตามสเปค)
    if (!roles.includes(req.user.role)) {
      const err = new Error(
        "You do not have permission to perform this action"
      );
      err.statusCode = 403;
      err.code = "ACCESS_DENIED";

      return next(err);
    }

    next();
  };
};

module.exports = authorize;
