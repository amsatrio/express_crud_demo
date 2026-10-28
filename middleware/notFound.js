import { NotFoundError } from '../errors/http.js';

export function notFound(req, res, next) {
  next(new NotFoundError('Route not found'));
}
