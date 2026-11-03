const healthRepository = require('../data/healthRepository');

const DB_TIMEOUT_MS = 3000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function check() {
  const started = Date.now();
  let dbUp = true;
  try {
    await withTimeout(healthRepository.ping(), DB_TIMEOUT_MS);
  } catch {
    dbUp = false;
  }

  return {
    status: dbUp ? 'ok' : 'unavailable',
    app: { status: 'up', uptimeSeconds: Math.round(process.uptime()) },
    database: { status: dbUp ? 'up' : 'down', latencyMs: Date.now() - started },
    timestamp: new Date().toISOString(),
  };
}

module.exports = { check };
