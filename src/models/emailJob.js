const JOB_STATUSES = ['pending', 'sent', 'failed'];

function toEmailJob(row, { includeBody = false } = {}) {
  const job = {
    id: row.id,
    applicationId: row.application_id,
    to: row.to_email,
    subject: row.subject,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    providerId: row.provider_id,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeBody) job.html = row.html;
  return job;
}

module.exports = { JOB_STATUSES, toEmailJob };
