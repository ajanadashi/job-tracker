const { ValidationError, NotFoundError } = require('../models/errors');

function notFound(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: `Route ${req.method} ${req.path} not found` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: { code: 'validation_error', message: err.message, details: err.details } });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { code: 'not_found', message: err.message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'payload_too_large', message: 'Request body too large' } });
  }
  console.error('[api] unhandled error:', err);
  return res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
}

module.exports = { notFound, errorHandler };
