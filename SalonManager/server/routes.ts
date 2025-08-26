import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSalonSchema, insertServiceSchema, insertStylistSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

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

  app.get('/api/v1/salons/:id/slots', async (req, res) => {
    try {
      const { service_id, date, stylist_id } = req.query;
      if (!service_id || !date) {
        return res.status(400).json({ message: "service_id and date are required" });
      }
      const slots = await storage.findSlots(
        req.params.id,
        service_id as string,
        date as string,
        stylist_id as string | undefined
      );
      res.json(slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  // Protected routes
  app.post('/api/v1/salons/:id/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        salonId: req.params.id,
        customerId: userId,
      });

      const service = await storage.getService(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const startsAt = new Date(bookingData.startsAt);
      const endsAt = new Date(startsAt.getTime() + (service.durationMin + 5) * 60000);

      try {
        const booking = await storage.createBooking({
          ...bookingData,
          endsAt,
        });
        res.json(booking);
      } catch (err: any) {
        if (err instanceof Error && err.message === "OVERLAP") {
          return res.status(422).json({ errors: { starts_at: ["overlap"] } });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
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
