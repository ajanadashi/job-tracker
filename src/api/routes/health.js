const { Router } = require('express');
const asyncHandler = require('../asyncHandler');
const healthService = require('../../services/healthService');

const router = Router();

// 200 when the app and database are up, 503 when the database is unreachable.
router.get('/health', asyncHandler(async (req, res) => {
  const report = await healthService.check();
  res.status(report.status === 'ok' ? 200 : 503).json(report);
}));

module.exports = router;
