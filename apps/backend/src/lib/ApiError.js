class ApiError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }

  // 400
  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(message, 400, errors);
  }

  // 401
  static unauthorized(message = 'Unauthorized', errors = []) {
    return new ApiError(message, 401, errors);
  }

  // 403
  static forbidden(message = 'Forbidden', errors = []) {
    return new ApiError(message, 403, errors);
  }

  // 404
  static notFound(message = 'Not Found', errors = []) {
    return new ApiError(message, 404, errors);
  }

  // 409
  static conflict(message = 'Conflict', errors = []) {
    return new ApiError(message, 409, errors);
  }

  // 400 (business rule)
  static insufficientFunds(message = 'Insufficient funds', errors = []) {
    return new ApiError(message, 400, errors);
  }

  // 500
  static internal(message = 'Internal Server Error', errors = []) {
    return new ApiError(message, 500, errors);
  }
}

export { ApiError };
