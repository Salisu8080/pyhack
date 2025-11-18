// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  }

  if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    status = 409;
    message = 'Duplicate entry or constraint violation';
  }

  // Send error response
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl
  });
};

module.exports = { errorHandler, notFound };
