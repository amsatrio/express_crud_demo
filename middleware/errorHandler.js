import { AppError } from '../errors/AppError.js';

const DB_ERRORS = {
  ER_DUP_ENTRY: { status: 409, code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' },
  ER_NO_REFERENCED_ROW_2: { status: 400, code: 'INVALID_REFERENCE', message: 'Referenced record does not exist' },
  ER_ROW_IS_REFERENCED_2: { status: 409, code: 'RECORD_IN_USE', message: 'Record is still referenced by other data' },
  ER_DATA_TOO_LONG: { status: 400, code: 'DATA_TOO_LONG', message: 'Data too long for one of the fields' },
  ER_BAD_NULL_ERROR: { status: 400, code: 'MISSING_FIELD', message: 'A required field is missing' },
  ECONNREFUSED: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' },
  PROTOCOL_CONNECTION_LOST: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' },
  ETIMEDOUT: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' },
  ENOTFOUND: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' },
  ER_ACCESS_DENIED_ERROR: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' },
};

const BODY_ERRORS = {
  'entity.parse.failed': { status: 400, code: 'INVALID_JSON', message: 'Invalid JSON payload' },
  'entity.too.large': { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request payload too large' },
};

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getPath(req) {
  if (req.originalUrl) {
    return req.originalUrl.split('?')[0];
  }
  return req.url?.split('?')[0] || '';
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let message = 'Internal Server Error';
  let code;
  let details;
  let errorDetail;

  if (err instanceof AppError) {
    status = err.status;
    message = err.expose ? err.message : 'Internal Server Error';
    if (err.expose) {
      code = err.code;
      details = err.details;
      if (details !== undefined) {
        errorDetail = details;
      } else if (err.message) {
        errorDetail = err.message;
      }
    }
  } else if (BODY_ERRORS[err.type]) {
    ({ status, message, code } = BODY_ERRORS[err.type]);
    errorDetail = message;
  } else if (DB_ERRORS[err.code]) {
    ({ status, message, code } = DB_ERRORS[err.code]);
    errorDetail = message;
  } else if (err.name === 'ValidationError' || err.name === 'BadRequestError') {
    status = err.status || 400;
    message = err.message || 'Bad Request';
    errorDetail = err.details || err.message;
  } else if (err.name === 'NotFoundError') {
    status = err.status || 404;
    message = err.message || 'Not Found';
    errorDetail = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = err.status || 401;
    message = err.message || 'Unauthorized';
    errorDetail = err.details || err.message;
  } else if (err.name === 'ForbiddenError') {
    status = err.status || 403;
    message = err.message || 'Forbidden';
    errorDetail = err.details || err.message;
  } else if (err.name === 'ConflictError') {
    status = err.status || 409;
    message = err.message || 'Conflict';
    errorDetail = err.details || err.message;
  }

  if (status >= 500) {
    console.error(`[${req.id ?? '-'}] ${req.method} ${req.originalUrl} -> ${status}`, err);
  }

  const payload = {
    path: getPath(req),
    timestamp: timestamp(),
    status,
    message,
  };

  if (code) payload.code = code;
  if (details !== undefined) payload.details = details;
  if (errorDetail !== undefined) {
    payload.error = errorDetail;
  } else if (code || details !== undefined) {
    // keep backward compatible structure if needed
  }

  res.status(status).json(payload);
}
