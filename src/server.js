const config = require('./config');
const app = require('./app');
const emailWorker = require('./worker/emailWorker');
const lifecycle = require('./services/lifecycleService');

if (!config.databaseUrl) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const server = app.listen(config.port, () => console.log(`[server] listening on :${config.port}`));
const worker = config.runWorker ? emailWorker.start() : null;

async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10000).unref();
  server.close();
  if (worker) await worker.stop();
  await lifecycle.shutdown();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
