import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSalonSchema, insertServiceSchema, insertStylistSchema } from "@shared/schema";

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

  app.get('/api/v1/salons/:id/services', async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.params.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/v1/salons/:id/stylists', async (req, res) => {
    try {
      const stylists = await storage.getStylistsBySalon(req.params.id);
      res.json(stylists);
    } catch (error) {
      console.error("Error fetching stylists:", error);
      res.status(500).json({ message: "Failed to fetch stylists" });
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

  app.get('/api/v1/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const { scope, salon_id } = req.query;
      const userId = req.user.claims.sub;

      if (scope === 'me') {
        const bookings = await storage.listBookingsForUser(userId);
        return res.json(bookings);
      }

      if (scope === 'salon') {
        if (!salon_id) {
          return res.status(400).json({ message: 'salon_id required' });
        }
        const bookings = await storage.listBookingsForSalon(salon_id as string);
        return res.json(bookings);
      }

      return res.status(400).json({ message: 'Invalid scope' });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.patch('/api/v1/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      
      if (!["confirmed", "declined", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await storage.updateBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Admin routes (salon_owner only)
  app.post('/api/v1/salons/:id/services', isAuthenticated, async (req: any, res) => {
    try {
      const serviceData = insertServiceSchema.parse({
        ...req.body,
        salonId: req.params.id,
      });

      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch('/api/v1/services/:id', isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/v1/services/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
