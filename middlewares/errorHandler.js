const errorResponse = (res, statusCode, code, message, details = null) => {
  const error = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: res.req.path,
    },
  };

  if (details) {
    error.error.details = details;
  }

  return res.status(statusCode).json(error);
};

// Validation error (400)
const validationError = (res, details) => {
  return errorResponse(
    res,
    400,
    "VALIDATION_ERROR",
    "Invalid input data",
    details
  );
};

// Unauthorized (401)
const unauthorizedError = (res, message = "Unauthorized access") => {
  return errorResponse(res, 401, "UNAUTHORIZED", message);
};

// Forbidden (403)
const forbiddenError = (res, message = "Access denied") => {
  return errorResponse(res, 403, "FORBIDDEN", message);
};

// Not found (404)
const notFoundError = (res, resource = "Resource") => {
  return errorResponse(res, 404, "NOT_FOUND", `${resource} not found`);
};

// Conflict (409)
const conflictError = (res, message = "Resource conflict") => {
  return errorResponse(res, 409, "CONFLICT", message);
};

// Rate limit (429)
const rateLimitError = (res, retryAfter) => {
  const message = `Too many requests. Try again in ${Math.ceil(
    retryAfter / 60
  )} minutes`;
  return errorResponse(res, 429, "RATE_LIMIT_EXCEEDED", message, {
    retryAfter,
  });
};

// Internal server error (500)
const internalError = (res, message = "Internal server error") => {
  return errorResponse(res, 500, "INTERNAL_ERROR", message);
};

module.exports = {
  errorResponse,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  internalError,
};
