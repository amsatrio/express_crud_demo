export class AppError extends Error {
  constructor(message, { status = 500, code, details, expose = status < 500 } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = expose;
  }
}
