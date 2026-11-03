const express = require('express');
const health = require('./api/routes/health');
const applications = require('./api/routes/applications');
const emails = require('./api/routes/emails');
const { notFound, errorHandler } = require('./api/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (req.path !== '/health') console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

app.get('/', (req, res) => res.json({ name: 'job-tracker-api', health: '/health', docs: 'see README' }));
app.use(health);
app.use('/applications', applications);
app.use('/emails', emails);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
