import { Router } from 'express';
import { env } from '../env';

export const legalRouter = Router();

legalRouter.get('/legal/impressum', (_req, res) => {
  if (!env.IMPRESSUM_HTML) return res.status(404).json({ message: 'No content' });
  res.type('html').send(env.IMPRESSUM_HTML);
});

legalRouter.get('/legal/datenschutz', (_req, res) => {
  if (!env.PRIVACY_HTML) return res.status(404).json({ message: 'No content' });
  res.type('html').send(env.PRIVACY_HTML);
});
