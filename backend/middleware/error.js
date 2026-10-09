const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Avoid logging provider payloads, connection strings or request config.
  console.error('[Error]', {
    name: err.name || 'Error',
    code: err.code || undefined,
    statusCode: err.statusCode || undefined,
    method: req.method,
    path: req.path,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json({ success: false, message: error.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return res.status(400).json({ success: false, message: error.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    // Only send explicit client-safe messages on non-server errors. Provider
    // SDK, database and infrastructure messages can contain internals.
    message: statusCode >= 500
      ? (err.expose ? error.message : 'An unexpected server error occurred. Please try again later.')
      : (error.message || 'Request could not be completed.'),
  });
};

module.exports = errorHandler;
