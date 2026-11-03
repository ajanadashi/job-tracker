const { pool } = require('./db');

async function ping() {
  await pool.query('SELECT 1');
}

module.exports = { ping };
