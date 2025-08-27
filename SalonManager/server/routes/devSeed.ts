import type { Express } from 'express';
import { seedDemo } from '../dev/seed';

export function registerDevSeedRoute(app: Express) {
  app.post('/api/v1/seed', async (req, res) => {
    if (process.env.ENABLE_DEV_SEED !== 'true' || process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    try {
      const result = await seedDemo();
      res.json({ ok: true, ...result });
    } catch (e: any) {
      console.error('[seed] failed', e);
      res.status(500).json({ message: 'Seed failed', error: e?.message });
    }
  });
}
