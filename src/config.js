require('dotenv').config();

const int = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name] !== '' && process.env[name] !== undefined
    ? value
    : fallback;
};

module.exports = {
  port: int('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'Job Tracker <onboarding@resend.dev>',
  runWorker: process.env.RUN_WORKER !== 'false',
  workerPollMs: int('WORKER_POLL_MS', 2000),
  emailMaxRetries: int('EMAIL_MAX_RETRIES', 3),
  emailRetryBaseSeconds: int('EMAIL_RETRY_BASE_SECONDS', 30),
};
