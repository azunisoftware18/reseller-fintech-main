export const httpExceptionFilter = (err, req, res, next) => {
  console.error("=========== ERROR ===========");
  console.error(err);

  if (err.cause) {
    console.error("=========== CAUSE ===========");
    console.error(err.cause);
  }

  if (err.stack) {
    console.error("=========== STACK ===========");
    console.error(err.stack);
  }

  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || [];

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON format";
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