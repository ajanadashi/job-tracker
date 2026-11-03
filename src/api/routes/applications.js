const { Router } = require('express');
const asyncHandler = require('../asyncHandler');
const { validateApplication, validateId, parseApplicationListQuery } = require('../validators');
const applicationService = require('../../services/applicationService');

const router = Router();

router.post('/', asyncHandler(async (req, res) => {
  const input = validateApplication(req.body);
  const app = await applicationService.create(input);
  res.status(201).location(`/applications/${app.id}`).json(app);
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await applicationService.list(parseApplicationListQuery(req.query)));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await applicationService.get(validateId(req.params.id)));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = validateId(req.params.id);
  const changes = validateApplication(req.body, { partial: true });
  res.json(await applicationService.update(id, changes));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await applicationService.remove(validateId(req.params.id));
  res.status(204).end();
}));

module.exports = router;
