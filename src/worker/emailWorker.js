const config = require('../config');
const emailService = require('../services/emailService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls the queue forever. Drains all due jobs, then sleeps until the next poll.
function start() {
  let stopped = false;

  const loop = (async () => {
    console.log(`[worker] started (poll every ${config.workerPollMs}ms)`);
    while (!stopped) {
      try {
        let worked;
        do {
          worked = await emailService.processNext();
        } while (worked && !stopped);
      } catch (err) {
        console.error('[worker] loop error:', err.message);
      }
      if (!stopped) await sleep(config.workerPollMs);
    }
    console.log('[worker] stopped');
  })();

  return {
    async stop() {
      stopped = true;
      await loop;
    },
  };
}

module.exports = { start };
