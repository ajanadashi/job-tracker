const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(title, body) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
  <h2>${esc(title)}</h2>${body}
  <p style="color:#888;font-size:12px">Sent by Job Tracker</p>
</div>`;
}

function applicationCreated(app) {
  return {
    subject: `Now tracking: ${app.position} at ${app.company}`,
    html: layout(
      'New application tracked',
      `<p>You are now tracking <strong>${esc(app.position)}</strong> at <strong>${esc(app.company)}</strong>.</p>
       <p>Current status: <strong>${esc(app.status)}</strong></p>`
    ),
  };
}

function statusChanged(app, previousStatus) {
  return {
    subject: `${app.company}: status is now ${app.status}`,
    html: layout(
      'Application status updated',
      `<p>Your application for <strong>${esc(app.position)}</strong> at <strong>${esc(app.company)}</strong> moved from
       <em>${esc(previousStatus)}</em> to <strong>${esc(app.status)}</strong>.</p>`
    ),
  };
}

module.exports = { applicationCreated, statusChanged };
