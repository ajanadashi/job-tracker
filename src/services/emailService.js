const config = require('../config');
const jobs = require('../data/emailJobRepository');
const mailer = require('./mailer');
const { JOB_STATUSES } = require('../models/emailJob');
const { NotFoundError } = require('../models/errors');

// Total attempts = first try + configured retries
const maxAttempts = () => 1 + config.emailMaxRetries;

// Used by other services inside their own transaction (pass the tx client as `db`).
function enqueue({ applicationId, toEmail, subject, html }, db) {
  return jobs.enqueue({ applicationId, toEmail, subject, html, maxAttempts: maxAttempts() }, db);
}

// Worker entry: claim one due job, send it, record the outcome. Returns false when idle.
async function processNext() {
  const job = await jobs.claimNext();
  if (!job) return false;

  try {
    const providerId = await mailer.send({ to: job.to, subject: job.subject, html: job.html });
    await jobs.markSent(job.id, providerId);
    console.log(`[email] sent job ${job.id} (attempt ${job.attempts + 1})`);
  } catch (err) {
    const delay = config.emailRetryBaseSeconds * 2 ** job.attempts;
    await jobs.recordFailure(job.id, err.message, delay);
    const willRetry = job.attempts + 1 < job.maxAttempts;
    console.error(
      `[email] job ${job.id} failed (attempt ${job.attempts + 1}/${job.maxAttempts}): ${err.message}` +
        (willRetry ? ` - retrying in ${delay}s` : ' - giving up')
    );
  }
  return true;
}

function list(query) {
  return jobs.findAll(query);
}

async function get(id) {
  const job = await jobs.findById(id);
  if (!job) throw new NotFoundError('Email job');
  return job;
}

async function stats() {
  const counts = await jobs.countByStatus();
  return Object.fromEntries(JOB_STATUSES.map((s) => [s, counts[s] || 0]));
}

module.exports = { enqueue, processNext, list, get, stats };
