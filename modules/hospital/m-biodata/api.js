import { hospitalPool } from '../../../config/db.js';
import { BadRequestError, NotFoundError } from '../../../errors/http.js';
import { ok, created, err } from '../../../utils/response.js';

const SELECT_FIELDS = 'id, fullname, mobile_phone, image_path, created_by, created_on, modified_by, modified_on, deleted_by, deleted_on, is_delete';

const EDITABLE_FIELDS = {
  fullname: 'fullname',
  mobile_phone: 'mobile_phone',
  image_path: 'image_path',
};

function normalizeText(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value;
}

function camelToSnake(str) {
  if (!str) return str;
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function assertValidId(id, label = 'id') {
  if (!/^\d+$/.test(String(id))) {
    throw new BadRequestError(`${label} must be a positive integer.`);
  }
}

function assertActorId(actorId, label = 'actor id') {
  if (actorId === undefined || actorId === null || actorId === '') {
    throw new BadRequestError(`${label} is a required field.`);
  }
  if (!/^\d+$/.test(String(actorId))) {
    throw new BadRequestError(`${label} must be a positive integer.`);
  }
}

function assertPhone(mobile_phone) {
  if (mobile_phone && String(mobile_phone).length > 15) {
    throw new BadRequestError('mobile_phone must be at most 15 characters.');
  }
}

// 1. CREATE
export async function createBiodata(req, res) {
  const { fullname, mobile_phone, image_path, created_by } = req.body ?? {};

  if (!fullname || !String(fullname).trim()) {
    throw new BadRequestError('fullname is a required field.');
  }
  assertActorId(created_by, 'created_by');
  assertPhone(mobile_phone);

  const query = `
    INSERT INTO m_biodata (fullname, mobile_phone, image_path, created_by, created_on, is_delete)
    VALUES (?, ?, ?, ?, NOW(), 0)
  `;

  const [result] = await hospitalPool.execute(query, [
    String(fullname).trim(),
    normalizeText(mobile_phone),
    normalizeText(image_path),
    created_by,
  ]);

  const [rows] = await hospitalPool.execute(
    `SELECT ${SELECT_FIELDS} FROM m_biodata WHERE id = ?`,
    [result.insertId]
  );

  return created(res, req, rows[0]);
}

// 2. READ ALL (with pagination, search, filter, sorting)
export async function getAllBiodata(req, res) {
  const {
    search = '',
    page = '0',
    size = '5',
    sort = '[]',
    filter = '[]',
    limit,
    offset
  } = req.query;

  const pageInt = parseInt(page, 10);
  const sizeInt = parseInt(size, 10);

  if (isNaN(pageInt) || pageInt < 0) {
    throw new BadRequestError('page must be a non-negative integer.');
  }
  if (isNaN(sizeInt) || sizeInt < 1) {
    throw new BadRequestError('size must be a positive integer.');
  }

  const isLetterNumber = /^[a-zA-Z0-9\s]+$/.test(search);
  if (search && !isLetterNumber) {
    throw new BadRequestError('parse data error: global search must not contains special character');
  }

  let sorts = [];
  let filters = [];
  try {
    sorts = typeof sort === 'string' ? JSON.parse(sort) : sort;
  } catch (e) {
    throw new BadRequestError('parse data error: ' + e.message);
  }
  try {
    filters = typeof filter === 'string' ? JSON.parse(filter) : filter;
  } catch (e) {
    throw new BadRequestError('parse data error: ' + e.message);
  }

  const conditions = ['is_delete = 0'];
  const params = [];

  if (search) {
    conditions.push('(fullname LIKE ? OR mobile_phone LIKE ? OR image_path LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (Array.isArray(filters)) {
    for (const f of filters) {
      if (!f || !f.id) continue;
      const key = camelToSnake(f.id);
      const value = f.value;
      const matchMode = f.matchMode || f.MatchMode || 'CONTAINS';

      if (matchMode === 'EQUALS') {
        conditions.push(`${key} = ?`);
        params.push(value);
      } else if (matchMode === 'NOT') {
        conditions.push(`${key} != ?`);
        params.push(value);
      } else if (matchMode === 'LESS_THAN') {
        conditions.push(`${key} < ?`);
        params.push(value);
      } else if (matchMode === 'GREATER_THAN') {
        conditions.push(`${key} > ?`);
        params.push(value);
      } else if (matchMode === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
        conditions.push(`${key} BETWEEN ? AND ?`);
        params.push(value[0], value[1]);
      } else {
        conditions.push(`${key} LIKE ?`);
        params.push(`%${value}%`);
      }
    }
  }

  // For backward compatibility with old params
  if (!search && (req.query.search || req.query.q)) {
    const s = req.query.search || req.query.q;
    conditions.push('(fullname LIKE ? OR mobile_phone LIKE ?)');
    params.push(`%${s}%`, `%${s}%`);
  }

  // Count total
  const countQuery = `SELECT COUNT(*) as total FROM m_biodata WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await hospitalPool.execute(countQuery, params);
  const totalElements = BigInt(countRows[0]?.total || 0);

  // Build main query
  let query = `SELECT ${SELECT_FIELDS} FROM m_biodata WHERE ${conditions.join(' AND ')}`;

  if (Array.isArray(sorts) && sorts.length > 0) {
    const orderClauses = sorts
      .filter(s => s && s.id)
      .map(s => {
        const key = camelToSnake(s.id);
        return s.desc === true || s.Desc === true ? `${key} DESC` : `${key} ASC`;
      });
    if (orderClauses.length > 0) {
      query += ' ORDER BY ' + orderClauses.join(', ');
    } else {
      query += ' ORDER BY id DESC';
    }
  } else {
    query += ' ORDER BY id DESC';
  }

  query += ' LIMIT ? OFFSET ?';
  const offsetVal = pageInt * sizeInt;
  const queryParams = [...params, sizeInt, offsetVal];

  const [rows] = await hospitalPool.execute(query, queryParams);

  const totalPages = totalElements === 0n ? 0n : (totalElements + BigInt(sizeInt) - 1n) / BigInt(sizeInt);

  const sortInfo = {
    empty: Number(totalElements) <= 0,
    sorted: Array.isArray(sorts) && sorts.length > 0,
    unsorted: !(Array.isArray(sorts) && sorts.length > 0),
  };

  const pageable = {
    offset: offsetVal,
    pageNumber: pageInt,
    pageSize: sizeInt,
    paged: true,
    unPaged: false,
    sort: sortInfo,
  };

  const pageResponse = {
    content: rows,
    pageable,
    sort: sortInfo,
    totalPages: Number(totalPages),
    totalElements: Number(totalElements),
    size: sizeInt,
    number: pageInt,
    numberOfElements: rows.length,
    last: Number(totalPages) === 0 ? true : pageInt === Number(totalPages) - 1,
    first: pageInt === 0,
    empty: rows.length === 0,
  };

  return ok(res, req, pageResponse);
}

// 3. READ ONE
export async function getBiodataById(req, res) {
  const { id } = req.params;
  assertValidId(id, 'biodata id');

  const [rows] = await hospitalPool.execute(
    `SELECT ${SELECT_FIELDS} FROM m_biodata WHERE id = ? AND is_delete = 0`,
    [id]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Biodata not found');
  }

  return ok(res, req, rows[0]);
}

// 4. UPDATE (full replace: PUT)
export async function updateBiodata(req, res) {
  const { id } = req.params;
  const { fullname, mobile_phone, image_path, modified_by } = req.body ?? {};

  assertValidId(id, 'biodata id');
  if (!fullname || !String(fullname).trim()) {
    throw new BadRequestError('fullname is a required field.');
  }
  assertActorId(modified_by, 'modified_by');
  assertPhone(mobile_phone);

  const query = `
    UPDATE m_biodata
    SET fullname = ?, mobile_phone = ?, image_path = ?, modified_by = ?, modified_on = NOW()
    WHERE id = ? AND is_delete = 0
  `;

  const [result] = await hospitalPool.execute(query, [
    String(fullname).trim(),
    normalizeText(mobile_phone),
    normalizeText(image_path),
    modified_by,
    id,
  ]);

  if (result.affectedRows === 0) {
    throw new NotFoundError('Biodata not found or already deleted');
  }

  const [rows] = await hospitalPool.execute(
    `SELECT ${SELECT_FIELDS} FROM m_biodata WHERE id = ?`,
    [id]
  );

  return ok(res, req, rows[0]);
}

// 4b. UPDATE (partial: PATCH)
export async function patchBiodata(req, res) {
  const { id } = req.params;
  const body = req.body ?? {};
  const { modified_by } = body;

  assertValidId(id, 'biodata id');
  assertActorId(modified_by, 'modified_by');

  const sets = [];
  const params = [];

  for (const [key, column] of Object.entries(EDITABLE_FIELDS)) {
    if (body[key] === undefined) continue;
    if (key === 'fullname' && !String(body[key]).trim()) {
      throw new BadRequestError('fullname cannot be empty.');
    }
    if (key === 'mobile_phone') {
      assertPhone(body[key]);
    }
    sets.push(`${column} = ?`);
    params.push(key === 'fullname' ? String(body[key]).trim() : normalizeText(body[key]));
  }

  if (sets.length === 0) {
    throw new BadRequestError('No updatable fields provided.');
  }

  sets.push('modified_by = ?', 'modified_on = NOW()');
  params.push(modified_by, id);

  const [result] = await hospitalPool.execute(
    `UPDATE m_biodata SET ${sets.join(', ')} WHERE id = ? AND is_delete = 0`,
    params
  );

  if (result.affectedRows === 0) {
    throw new NotFoundError('Biodata not found or already deleted');
  }

  const [rows] = await hospitalPool.execute(
    `SELECT ${SELECT_FIELDS} FROM m_biodata WHERE id = ?`,
    [id]
  );

  return ok(res, req, rows[0]);
}

// 5. DELETE (Soft delete)
export async function deleteBiodata(req, res) {
  const { id } = req.params;
  const deleted_by = req.body?.deleted_by ?? req.query.deleted_by;

  assertValidId(id, 'biodata id');
  assertActorId(deleted_by, 'deleted_by');

  const query = `
    UPDATE m_biodata
    SET is_delete = 1, deleted_by = ?, deleted_on = NOW()
    WHERE id = ? AND is_delete = 0
  `;

  const [result] = await hospitalPool.execute(query, [deleted_by, id]);

  if (result.affectedRows === 0) {
    throw new NotFoundError('Biodata not found or already deleted');
  }

  return ok(res, req, { message: 'Biodata deleted successfully (soft delete)' });
}
