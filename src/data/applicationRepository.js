const { pool } = require('./db');
const { COLUMN_MAP, toApplication } = require('../models/application');

function buildFilters({ status, search }) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(company ILIKE $${params.length} OR position ILIKE $${params.length})`);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function create(data, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO applications
       (company, position, status, url, location, salary_range, notes, notify_email, applied_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::date, CURRENT_DATE))
     RETURNING *`,
    [
      data.company,
      data.position,
      data.status || 'applied',
      data.url ?? null,
      data.location ?? null,
      data.salaryRange ?? null,
      data.notes ?? null,
      data.notifyEmail ?? null,
      data.appliedAt ?? null,
    ]
  );
  return toApplication(rows[0]);
}

async function findAll({ status, search, limit, offset }, db = pool) {
  const { clause, params } = buildFilters({ status, search });
  const totalResult = await db.query(`SELECT count(*)::int AS n FROM applications ${clause}`, params);
  const { rows } = await db.query(
    `SELECT * FROM applications ${clause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: rows.map(toApplication), total: totalResult.rows[0].n };
}

async function findById(id, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM applications WHERE id = $1 ${forUpdate ? 'FOR UPDATE' : ''}`,
    [id]
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

async function update(id, changes, db = pool) {
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(COLUMN_MAP)) {
    if (key in changes) {
      params.push(changes[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  if (!sets.length) return findById(id, db);
  params.push(id);
  const { rows } = await db.query(
    `UPDATE applications SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

async function remove(id, db = pool) {
  const { rowCount } = await db.query('DELETE FROM applications WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { create, findAll, findById, update, remove };
