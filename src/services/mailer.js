const { Resend } = require('resend');
const config = require('../config');

let client;

// Sends one email through Resend and returns the provider message id.
// Throws on any failure so the queue can record it and retry.
async function send({ to, subject, html }) {
  if (!config.resendApiKey) throw new Error('RESEND_API_KEY is not configured');
  if (!client) client = new Resend(config.resendApiKey);

  const { data, error } = await client.emails.send({
    from: config.emailFrom,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`${error.name || 'ResendError'}: ${error.message}`);
  return data.id;
}

module.exports = { send };
