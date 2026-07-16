export const httpExceptionFilter = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // JSON parse error (body-parser)
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON format';
    errors = [];
  }

  res.status(status).json({
    success: false,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    message,
    errors,
  });
};
