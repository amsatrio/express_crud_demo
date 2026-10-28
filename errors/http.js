import { AppError } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', options = {}) {
    super(message, { status: 400, code: 'BAD_REQUEST', ...options });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', options = {}) {
    super(message, { status: 401, code: 'UNAUTHORIZED', ...options });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', options = {}) {
    super(message, { status: 403, code: 'FORBIDDEN', ...options });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', options = {}) {
    super(message, { status: 404, code: 'NOT_FOUND', ...options });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', options = {}) {
    super(message, { status: 409, code: 'CONFLICT', ...options });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', options = {}) {
    super(message, { status: 503, code: 'SERVICE_UNAVAILABLE', ...options });
  }
}
