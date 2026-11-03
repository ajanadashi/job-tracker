const { pool } = require('./db');
const { toEmailJob } = require('../models/emailJob');

const LOCK_SECONDS = 60;

async function enqueue({ applicationId, toEmail, subject, html, maxAttempts }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO email_jobs (application_id, to_email, subject, html, max_attempts)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [applicationId ?? null, toEmail, subject, html, maxAttempts]
  );
  return toEmailJob(rows[0]);
}

// Atomically claims one due job. SKIP LOCKED lets several workers run safely, and
// locked_until releases the job automatically if a worker crashes mid-send.
async function claimNext(db = pool) {
  const { rows } = await db.query(
    `UPDATE email_jobs
        SET locked_until = now() + ($1 * interval '1 second'), updated_at = now()
      WHERE id = (
        SELECT id FROM email_jobs
         WHERE status = 'pending'
           AND next_attempt_at <= now()
           AND (locked_until IS NULL OR locked_until < now())
         ORDER BY next_attempt_at
         LIMIT 1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING *`,
    [LOCK_SECONDS]
  );
  return rows[0] ? { ...toEmailJob(rows[0]), html: rows[0].html } : null;
}

async function markSent(id, providerId, db = pool) {
  await db.query(
    `UPDATE email_jobs
        SET status = 'sent', attempts = attempts + 1, provider_id = $2, sent_at = now(),
            last_error = NULL, locked_until = NULL, updated_at = now()
      WHERE id = $1`,
    [id, providerId]
  );
}

// Counts the failed attempt. Goes back to 'pending' (with backoff) until max_attempts
// is reached, then becomes 'failed' for good.
async function recordFailure(id, errorMessage, delaySeconds, db = pool) {
  await db.query(
    `UPDATE email_jobs
        SET attempts = attempts + 1,
            last_error = $2,
            locked_until = NULL,
            status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
            next_attempt_at = now() + ($3 * interval '1 second'),
            updated_at = now()
      WHERE id = $1`,
    [id, errorMessage.slice(0, 1000), delaySeconds]
  );
}

async function findAll({ status, limit, offset }, db = pool) {
  const params = [];
  let clause = '';
  if (status) {
    params.push(status);
    clause = `WHERE status = $1`;
  }
  const total = await db.query(`SELECT count(*)::int AS n FROM email_jobs ${clause}`, params);
  const { rows } = await db.query(
    `SELECT * FROM email_jobs ${clause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: rows.map((r) => toEmailJob(r)), total: total.rows[0].n };
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM email_jobs WHERE id = $1', [id]);
  return rows[0] ? toEmailJob(rows[0], { includeBody: true }) : null;
}

async function countByStatus(db = pool) {
  const { rows } = await db.query(
    'SELECT status, count(*)::int AS n FROM email_jobs GROUP BY status'
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

module.exports = { enqueue, claimNext, markSent, recordFailure, findAll, findById, countByStatus };
