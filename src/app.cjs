const express = require('express');
const { validate, statuses, badRequest } = require('./validation.cjs');

function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/', (req, res) => res.json({ project: 'Hackathon CRUD lab', resources: ['/api/tasks', '/api/reports'], guide: 'docs/LEARNING.md' }));
  app.get('/health', (req, res) => res.json({ ok: true }));

  for (const kind of ['tasks', 'reports']) {
    const route = '/api/' + kind;
    app.get(route, (req, res) => {
      const { status, q } = req.query;
      if (status !== undefined && !statuses[kind].includes(status)) throw badRequest('Invalid status filter');
      if (q !== undefined && (typeof q !== 'string' || q.length > 120)) throw badRequest('Invalid text filter');
      let records = store.list(kind);
      if (status !== undefined) records = records.filter(record => record.status === status);
      if (q !== undefined) records = records.filter(record => record.title.toLowerCase().includes(q.toLowerCase()));
      res.json(records);
    });
    app.get(route + '/:id', (req, res) => {
      const record = store.get(kind, req.params.id);
      if (!record) return res.status(404).json({ error: 'Record not found' });
      res.json(record);
    });
    app.post(route, (req, res) => {
      const record = store.create(kind, validate(kind, req.body));
      res.location(route + '/' + record.id).status(201).json(record);
    });
    app.patch(route + '/:id', (req, res) => {
      const record = store.update(kind, req.params.id, validate(kind, req.body, true));
      if (!record) return res.status(404).json({ error: 'Record not found' });
      res.json(record);
    });
    app.delete(route + '/:id', (req, res) => {
      if (!store.delete(kind, req.params.id)) return res.status(404).json({ error: 'Record not found' });
      res.status(204).end();
    });
  }
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 400 || error.status === 413 ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'Internal error' : error.message });
  });
  return app;
}
module.exports = { createApp };
