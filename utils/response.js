function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function base(path) {
  return {
    path,
    timestamp: timestamp(),
  };
}

function getPath(req) {
  if (req.originalUrl) {
    return req.originalUrl.split('?')[0];
  }
  return req.url?.split('?')[0] || '';
}

export function ok(res, req, data) {
  const payload = { ...base(getPath(req)), status: 200, message: 'success' };
  if (data !== undefined) {
    payload.data = data;
  }
  return res.status(200).json(payload);
}

export function created(res, req, data) {
  const payload = { ...base(getPath(req)), status: 201, message: 'success' };
  if (data !== undefined) {
    payload.data = data;
  }
  return res.status(201).json(payload);
}

export function noContent(res, req) {
  const payload = { ...base(getPath(req)), status: 204, message: 'success' };
  return res.status(204).json(payload);
}

export function err(res, req, status, message, error) {
  const payload = { ...base(getPath(req)), status, message };
  if (error !== undefined) {
    payload.error = error;
  }
  return res.status(status).json(payload);
}

export function errMessage(res, req, status, message) {
  return err(res, getPath(req), status, message);
}

export function errMessagePayload(res, req, status, message, error) {
  return err(res, getPath(req), status, message, error);
}
