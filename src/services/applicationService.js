const applications = require('../data/applicationRepository');
const { withTransaction } = require('../data/db');
const emailService = require('./emailService');
const templates = require('./emailTemplates');
const { NotFoundError } = require('../models/errors');

// Business rule: the application row and its notification job are saved in ONE
// transaction, so we never have an application without its email (or vice versa).
// The request never talks to Resend; the background worker does that later.

function create(input) {
  return withTransaction(async (db) => {
    const app = await applications.create(input, db);
    if (app.notifyEmail) {
      await emailService.enqueue(
        { applicationId: app.id, toEmail: app.notifyEmail, ...templates.applicationCreated(app) },
        db
      );
    }
    return app;
  });
}

async function list(query) {
  const { items, total } = await applications.findAll(query);
  return { data: items, meta: { total, limit: query.limit, offset: query.offset } };
}

async function get(id) {
  const app = await applications.findById(id);
  if (!app) throw new NotFoundError('Application');
  return app;
}

function update(id, changes) {
  return withTransaction(async (db) => {
    const existing = await applications.findById(id, db, { forUpdate: true });
    if (!existing) throw new NotFoundError('Application');

    const updated = await applications.update(id, changes, db);

    const statusChanged = changes.status && changes.status !== existing.status;
    if (statusChanged && updated.notifyEmail) {
      await emailService.enqueue(
        { applicationId: id, toEmail: updated.notifyEmail, ...templates.statusChanged(updated, existing.status) },
        db
      );
    }
    return updated;
  });
}

async function remove(id) {
  const deleted = await applications.remove(id);
  if (!deleted) throw new NotFoundError('Application');
}

module.exports = { create, list, get, update, remove };
