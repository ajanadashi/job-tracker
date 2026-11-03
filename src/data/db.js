const { Pool, types } = require('pg');
const config = require('../config');

// Return DATE columns as 'YYYY-MM-DD' strings instead of JS Date objects
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction, close: () => pool.end() };
