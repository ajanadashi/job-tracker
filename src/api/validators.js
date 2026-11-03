const { STATUSES } = require('../models/application');
const { JOB_STATUSES } = require('../models/emailJob');
const { ValidationError } = require('../models/errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RULES = {
  company: { type: 'string', required: true, max: 200 },
  position: { type: 'string', required: true, max: 200 },
  status: { type: 'enum', values: STATUSES, nonNull: true, default: 'applied' },
  url: { type: 'url', max: 2000 },
  location: { type: 'string', max: 200 },
  salaryRange: { type: 'string', max: 200 },
  notes: { type: 'string', max: 5000 },
  notifyEmail: { type: 'email', max: 320 },
  appliedAt: { type: 'date', nonNull: true, max: 10 },
};

function checkValue(rule, value) {
  if (rule.type === 'enum') {
    return rule.values.includes(value) ? null : `must be one of: ${rule.values.join(', ')}`;
  }
  if (typeof value !== 'string') return 'must be a string';
  const s = value.trim();
  if (rule.required && !s) return 'must not be empty';
  if (s.length > rule.max) return `must be at most ${rule.max} characters`;
  if (rule.type === 'email' && !EMAIL_RE.test(s)) return 'must be a valid email address';
  if (rule.type === 'url') {
    try {
      if (!['http:', 'https:'].includes(new URL(s).protocol)) throw new Error();
    } catch {
      return 'must be a valid http(s) URL';
    }
  }
  if (rule.type === 'date' && !(/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)))) {
    return 'must be a date in YYYY-MM-DD format';
  }
  return null;
}

// partial = true for PATCH (every field optional, at least one required)
function validateApplication(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError([{ field: 'body', message: 'must be a JSON object' }]);
  }
  const errors = [];
  const value = {};

  for (const [field, rule] of Object.entries(RULES)) {
    const input = body[field];

    if (input === undefined) {
      if (partial) continue;
      if (rule.required) errors.push({ field, message: 'is required' });
      else if (rule.default !== undefined) value[field] = rule.default;
      continue;
    }
    if (input === null) {
      if (rule.required || rule.nonNull) errors.push({ field, message: 'cannot be null' });
      else value[field] = null;
      continue;
    }
    const message = checkValue(rule, input);
    if (message) errors.push({ field, message });
    else value[field] = typeof input === 'string' ? input.trim() : input;
  }

  if (partial && !errors.length && Object.keys(value).length === 0) {
    errors.push({ field: 'body', message: 'at least one updatable field is required' });
  }
  if (errors.length) throw new ValidationError(errors);
  return value;
}

function validateId(id) {
  if (!UUID_RE.test(id)) throw new ValidationError([{ field: 'id', message: 'must be a valid UUID' }]);
  return id;
}

function parseListQuery(query, { statuses }) {
  const errors = [];
  const out = { limit: 20, offset: 0 };

  if (query.status !== undefined) {
    if (!statuses.includes(query.status)) {
      errors.push({ field: 'status', message: `must be one of: ${statuses.join(', ')}` });
    } else out.status = query.status;
  }
  if (query.search !== undefined) out.search = String(query.search).trim().slice(0, 100) || undefined;

  if (query.limit !== undefined) {
    const n = Number(query.limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) errors.push({ field: 'limit', message: 'must be an integer between 1 and 100' });
    else out.limit = n;
  }
  if (query.offset !== undefined) {
    const n = Number(query.offset);
    if (!Number.isInteger(n) || n < 0) errors.push({ field: 'offset', message: 'must be an integer >= 0' });
    else out.offset = n;
  }
  if (errors.length) throw new ValidationError(errors);
  return out;
}

const parseApplicationListQuery = (q) => parseListQuery(q, { statuses: STATUSES });
const parseEmailListQuery = (q) => parseListQuery(q, { statuses: JOB_STATUSES });

module.exports = { validateApplication, validateId, parseApplicationListQuery, parseEmailListQuery };
