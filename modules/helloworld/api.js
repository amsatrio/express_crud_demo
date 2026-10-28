import { ok, err } from '../../utils/response.js';

export function helloWorld(req, res) {
  ok(res, req, 'hello world!');
}

export function helloWorldPath(req, res) {
  ok(res, req, req.params.message);
}

export function helloWorldQuery(req, res) {
  ok(res, req, req.query.message ?? null);
}

export function helloWorldPayload(req, res) {
  const path = req;
  const payload = req.body ?? {};
  const message = payload.message;

  const error = {};
  if (message === undefined || message === null || String(message) === '') {
    error.message = 'this field is mandatory';
  } else if (String(message).length < 5) {
    error.message = 'minimum 5 character(s)';
  } else if (String(message).length > 20) {
    error.message = 'maximum 20 character(s)';
  }

  if (Object.keys(error).length > 0) {
    return err(res, path, 400, 'invalid payload', error);
  }

  ok(res, path, { message });
}

export function helloWorldError(req, res) {
  const path = req;
  const { type } = req.params;

  if (type === '503') {
    return err(res, path, 503, 'error', 'On vacation!');
  }
  if (type === '500') {
    return err(res, path, 500, 'error', 'On vacation!');
  }

  ok(res, path, null);
}
