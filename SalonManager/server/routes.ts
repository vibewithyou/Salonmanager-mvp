import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  storage,
  listServicesBySalon,
  createService,
  updateService,
  deleteService,
  listStylistsBySalon,
  createStylist,
  updateStylist,
  deleteStylist,
  updateBookingStatus,
  listWorkHours,
  createWorkHour,
  updateWorkHour,
  deleteWorkHour,
} from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed data - run this once to populate the database
  app.post('/api/v1/seed', async (_req, res) => {
    try {
      await storage.seedDemo();
      res.json({ ok: true });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ ok: false, message: 'Failed to seed data' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes
  app.get('/api/v1/salons', async (_req, res, next) => {
    try {
      const data = await storage.getSalons();
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/salons/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id' });
      }

      const data = await storage.getSalon(id);
      if (!data) {
        return res.status(404).json({ message: 'Salon not found' });
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/salons/by-slug/:slug', async (req, res) => {
    try {
      const salon = await storage.getSalonBySlug(req.params.slug);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      res.json(salon);
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  app.get('/api/v1/salons/:id/services', async (req, res, next) => {
    try {
      const salonId = Number(req.params.id);
      if (!Number.isFinite(salonId)) {
        return res.status(400).json({ message: 'invalid salon id' });
      }
      const items = await listServicesBySalon(salonId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  // Stylists CRUD
  app.get('/api/v1/salons/:id/stylists', async (req, res, next) => {
    try {
      const salonId = Number(req.params.id);
      if (!Number.isFinite(salonId))
        return res.status(400).json({ message: 'invalid salon id' });
      const items = await listStylistsBySalon(salonId);
      const mapped = items.map((st) => ({
        id: st.id,
        salon_id: st.salonId,
        display_name: st.displayName,
        avatar_url: st.avatarUrl,
        active: st.active,
      }));
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/v1/salons/:id/stylists', async (req, res, next) => {
    try {
      const salonId = Number(req.params.id);
      if (!Number.isFinite(salonId))
        return res.status(400).json({ message: 'invalid salon id' });
      const { display_name, avatar_url, active } = req.body ?? {};
      const result = await createStylist(salonId, {
        display_name,
        avatar_url,
        active,
      });
      if (!result.ok)
        return res
          .status(result.status!)
          .json({ message: 'Validation failed', errors: result.errors });
      const d = result.data!;
      res
        .status(201)
        .json({
          id: d.id,
          salon_id: d.salonId,
          display_name: d.displayName,
          avatar_url: d.avatarUrl,
          active: d.active,
        });
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/v1/stylists/:stylistId', async (req, res, next) => {
    try {
      const stylistId = Number(req.params.stylistId);
      const salonId = Number(req.query.salon_id);
      if (!Number.isFinite(stylistId) || !Number.isFinite(salonId))
        return res
          .status(400)
          .json({ message: 'stylistId & salon_id required' });
      const { display_name, avatar_url, active } = req.body ?? {};
      const result = await updateStylist(stylistId, salonId, {
        display_name,
        avatar_url,
        active,
      });
      if (!result.ok)
        return res
          .status(result.status!)
          .json({ message: 'Validation failed', errors: result.errors });
      const d = result.data!;
      res.json({
        id: d.id,
        salon_id: d.salonId,
        display_name: d.displayName,
        avatar_url: d.avatarUrl,
        active: d.active,
      });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/v1/stylists/:stylistId', async (req, res, next) => {
    try {
      const stylistId = Number(req.params.stylistId);
      const salonId = Number(req.query.salon_id);
      if (!Number.isFinite(stylistId) || !Number.isFinite(salonId))
        return res
          .status(400)
          .json({ message: 'stylistId & salon_id required' });
      const result = await deleteStylist(stylistId, salonId);
      if (!result.ok)
        return res
          .status(result.status!)
          .json({ message: 'Validation failed', errors: result.errors });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Work hours CRUD
  app.get(
    '/api/v1/salons/:id/stylists/:stylistId/work-hours',
    async (req, res, next) => {
      try {
        const salonId = Number(req.params.id);
        const stylistId = Number(req.params.stylistId);
        if (!Number.isFinite(salonId) || !Number.isFinite(stylistId))
          return res.status(400).json({ message: 'invalid ids' });
        const rows = await listWorkHours(salonId, stylistId);
        res.json(rows);
      } catch (e) {
        next(e);
      }
    },
  );

  app.post(
    '/api/v1/salons/:id/stylists/:stylistId/work-hours',
    async (req, res, next) => {
      try {
        const salonId = Number(req.params.id);
        const stylistId = Number(req.params.stylistId);
        const { weekday, start, end } = req.body ?? {};
        const r = await createWorkHour(salonId, {
          stylist_id: stylistId,
          weekday,
          start,
          end,
        });
        if (!r.ok)
          return res
            .status(r.status!)
            .json({ message: 'Validation failed', errors: r.errors });
        res.status(201).json(r.data);
      } catch (e) {
        next(e);
      }
    },
  );

  app.patch('/api/v1/work-hours/:workHourId', async (req, res, next) => {
    try {
      const id = Number(req.params.workHourId);
      const salonId = Number(req.query.salon_id);
      const patch = req.body ?? {};
      if (!Number.isFinite(id) || !Number.isFinite(salonId))
        return res
          .status(400)
          .json({ message: 'workHourId & salon_id required' });
      const r = await updateWorkHour(salonId, id, patch);
      if (!r.ok)
        return res
          .status(r.status!)
          .json({ message: 'Validation failed', errors: r.errors });
      res.json(r.data);
    } catch (e) {
      next(e);
    }
  });

  app.delete('/api/v1/work-hours/:workHourId', async (req, res, next) => {
    try {
      const id = Number(req.params.workHourId);
      const salonId = Number(req.query.salon_id);
      if (!Number.isFinite(id) || !Number.isFinite(salonId))
        return res
          .status(400)
          .json({ message: 'workHourId & salon_id required' });
      const r = await deleteWorkHour(salonId, id);
      if (!r.ok)
        return res
          .status(r.status!)
          .json({ message: 'Validation failed', errors: r.errors });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/v1/salons/:id/slots', async (req, res, next) => {
    try {
      const salonId = req.params.id;
      const serviceId = req.query.service_id as string;
      const stylistId = req.query.stylist_id
        ? String(req.query.stylist_id)
        : undefined;
      const date = req.query.date as string;

      if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          message: 'Bad request: need service_id and date=YYYY-MM-DD',
        });
      }

      const slots = await storage.findSlots(salonId, serviceId, date, stylistId);
      res.json(slots);
    } catch (err) {
      next(err);
    }
  });

  // Protected routes
  app.post('/api/v1/salons/:id/bookings', async (req, res, next) => {
    try {
      const salonId = Number(req.params.id);
      if (!Number.isFinite(salonId)) return res.status(400).json({ message: 'Invalid salon id' });

      const { service_id, stylist_id, starts_at, note } = req.body ?? {};
      const errors: Record<string, string[]> = {};
      if (!Number.isFinite(Number(service_id))) errors.service_id = ['required numeric'];
      if (stylist_id != null && !Number.isFinite(Number(stylist_id))) errors.stylist_id = ['must be numeric'];
      if (typeof starts_at !== 'string') errors.starts_at = ['required ISO string'];
      if (Object.keys(errors).length) return res.status(422).json({ message: 'Validation failed', errors });

      const result = await storage.createBooking({
        salonId,
        serviceId: Number(service_id),
        stylistId: stylist_id == null ? null : Number(stylist_id),
        startsAtISO: String(starts_at),
        note: typeof note === 'string' ? note : null,
      });

      if (!result.ok) {
        return res.status(result.status || 422).json({ message: 'Validation failed', errors: result.error });
      }
      return res.status(201).json(result.booking);
    } catch (err) { next(err); }
  });

  app.get('/api/v1/bookings', async (req, res, next) => {
    try {
      const scope = (String(req.query.scope || '') as 'me' | 'salon');
      if (!['me', 'salon'].includes(scope)) {
        return res.status(400).json({ message: 'Bad request: scope=me|salon required' });
      }

      const salonId = req.query.salon_id ? Number(req.query.salon_id) : undefined;
      const fromISO = req.query.from ? String(req.query.from) : undefined;
      const toISO = req.query.to ? String(req.query.to) : undefined;
      const status = req.query.status as any;
      const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 50;
      const offset = req.query.offset ? Math.max(0, Number(req.query.offset)) : 0;

      if (status && !['requested', 'confirmed', 'declined', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Bad request: invalid status' });
      }
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      if ((fromISO && !dateRe.test(fromISO)) || (toISO && !dateRe.test(toISO))) {
        return res.status(400).json({ message: 'Bad request: from/to must be YYYY-MM-DD' });
      }
      if (scope === 'salon' && !Number.isFinite(salonId)) {
        return res.status(400).json({ message: 'Bad request: salon_id is required for scope=salon' });
      }

      const customerId: number | null = null;

      const data = await storage.listBookings({
        scope,
        salonId,
        customerId,
        fromISO,
        toISO,
        status,
        limit,
        offset,
      });

      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/v1/bookings/:id', isAuthenticated, async (req: any, res, next) => {
    try {
      const bookingId = Number(req.params.id);
      const salonId = Number(req.query.salon_id);
      const { status, reason } = req.body ?? {};

      if (!Number.isFinite(bookingId) || !Number.isFinite(salonId)) {
        return res
          .status(400)
          .json({ message: 'Bad request: booking id & salon_id required' });
      }
      if (
        !['requested', 'confirmed', 'declined', 'cancelled'].includes(
          String(status),
        )
      ) {
        return res.status(400).json({ message: 'Bad request: invalid status' });
      }

      const result = await updateBookingStatus({
        bookingId,
        salonId,
        to: status,
        reason: typeof reason === 'string' ? reason : null,
      });

      if (!result.ok)
        return res
          .status(result.status!)
          .json({ message: 'Validation failed', errors: result.errors });
      res.json(result.data);
    } catch (err) {
      next(err);
    }
  });

  // Services CRUD
  app.post('/api/v1/salons/:id/services', async (req, res, next) => {
    try {
      const salonId = Number(req.params.id);
      if (!Number.isFinite(salonId)) {
        return res.status(400).json({ message: 'invalid salon id' });
      }
      const { title, duration_min, price_cents, active } = req.body ?? {};
      const result = await createService(salonId, {
        title,
        duration_min,
        price_cents,
        active,
      });
      if (!result.ok) {
        return res
          .status(result.status ?? 500)
          .json({ message: 'Validation failed', errors: result.errors });
      }
      res.status(201).json(result.data);
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/v1/services/:serviceId', async (req, res, next) => {
    try {
      const serviceId = Number(req.params.serviceId);
      const salonId = Number(req.query.salon_id);
      if (!Number.isFinite(serviceId) || !Number.isFinite(salonId)) {
        return res
          .status(400)
          .json({ message: 'serviceId & salon_id required' });
      }
      const { title, duration_min, price_cents, active } = req.body ?? {};
      const result = await updateService(serviceId, salonId, {
        title,
        duration_min,
        price_cents,
        active,
      });
      if (!result.ok) {
        return res
          .status(result.status ?? 500)
          .json({ message: 'Validation failed', errors: result.errors });
      }
      res.json(result.data);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/v1/services/:serviceId', async (req, res, next) => {
    try {
      const serviceId = Number(req.params.serviceId);
      const salonId = Number(req.query.salon_id);
      if (!Number.isFinite(serviceId) || !Number.isFinite(salonId)) {
        return res
          .status(400)
          .json({ message: 'serviceId & salon_id required' });
      }
      const result = await deleteService(serviceId, salonId);
      if (!result.ok) {
        return res
          .status(result.status ?? 500)
          .json({ message: 'Validation failed', errors: result.errors });
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
