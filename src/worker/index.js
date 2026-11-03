// Standalone worker process: `npm run worker` (use with RUN_WORKER=false on the API).
const emailWorker = require('./emailWorker');
const lifecycle = require('../services/lifecycleService');

const worker = emailWorker.start();

async function shutdown() {
  await worker.stop();
  await lifecycle.shutdown();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
