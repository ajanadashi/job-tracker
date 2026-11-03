const db = require('../data/db');

// Releases resources on shutdown so the api/worker entry points never touch the data layer.
async function shutdown() {
  await db.close();
}

module.exports = { shutdown };
