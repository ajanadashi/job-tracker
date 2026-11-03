const { Router } = require('express');
const asyncHandler = require('../asyncHandler');
const { validateId, parseEmailListQuery } = require('../validators');
const emailService = require('../../services/emailService');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const query = parseEmailListQuery(req.query);
  const { items, total } = await emailService.list(query);
  res.json({ data: items, meta: { total, limit: query.limit, offset: query.offset } });
}));

// Must be declared before '/:id'
router.get('/stats', asyncHandler(async (req, res) => {
  res.json(await emailService.stats());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await emailService.get(validateId(req.params.id)));
}));

module.exports = router;
