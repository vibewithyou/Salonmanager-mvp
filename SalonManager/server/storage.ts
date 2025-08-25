import {
  users,
  salons,
  services,
  stylists,
  workHours,
  absences,
  bookings,
  type User,
  type UpsertUser,
  type Salon,
  type Service,
  type Stylist,
  type WorkHour,
  type Absence,
  type Booking,
  type InsertSalon,
  type InsertService,
  type InsertStylist,
  type InsertBooking,
  type SalonWithDetails,
  type BookingWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, asc, lt, gt, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Salon operations
  getSalons(): Promise<Salon[]>;
  getSalon(id: string): Promise<SalonWithDetails | undefined>;
  getSalonBySlug(slug: string): Promise<SalonWithDetails | undefined>;
  createSalon(salon: InsertSalon): Promise<Salon>;

  // Service operations
  getServicesBySalon(salonId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Stylist operations
  getStylistsBySalon(salonId: string): Promise<(Stylist & { user: User })[]>;
  getStylist(id: string): Promise<(Stylist & { user: User }) | undefined>;
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  updateStylist(id: string, stylist: Partial<InsertStylist>): Promise<Stylist>;
  deleteStylist(id: string): Promise<void>;

  // Work hours operations
  getWorkHoursByStylist(stylistId: string): Promise<WorkHour[]>;
  createWorkHours(workHour: Omit<WorkHour, 'id' | 'createdAt'>): Promise<WorkHour>;

  // Booking operations
  getBookingsByUser(userId: string): Promise<BookingWithDetails[]>;
  getBookingsBySalon(salonId: string): Promise<BookingWithDetails[]>;
  getBookingsByStylist(stylistId: string): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;

  // Alias methods for tasks
  listBookingsForUser(userId: string): Promise<BookingWithDetails[]>;
  listBookingsForSalon(salonId: string): Promise<BookingWithDetails[]>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;

  // Slot operations
  findSlots(
    salonId: string,
    serviceId: string,
    date: string,
    stylistId?: string,
  ): Promise<{ start: string; end: string; stylistId: string }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Salon operations
  async getSalons(): Promise<Salon[]> {
    return await db.select().from(salons);
  }

  async getSalon(id: string): Promise<SalonWithDetails | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    if (!salon) return undefined;

    const salonServices = await db.select().from(services).where(eq(services.salonId, id));
    const salonStylists = await db
      .select({
        id: stylists.id,
        salonId: stylists.salonId,
        userId: stylists.userId,
        displayName: stylists.displayName,
        avatarUrl: stylists.avatarUrl,
        active: stylists.active,
        isApprentice: stylists.isApprentice,
        createdAt: stylists.createdAt,
        updatedAt: stylists.updatedAt,
        user: users,
      })
      .from(stylists)
      .innerJoin(users, eq(stylists.userId, users.id))
      .where(eq(stylists.salonId, id));

    return {
      ...salon,
      services: salonServices,
      stylists: salonStylists,
    };
  }

  async getSalonBySlug(slug: string): Promise<SalonWithDetails | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.slug, slug));
    if (!salon) return undefined;
    return this.getSalon(salon.id);
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon).returning();
    return newSalon;
  }

  // Service operations
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.salonId, salonId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Stylist operations
  async getStylistsBySalon(salonId: string): Promise<(Stylist & { user: User })[]> {
    return await db
      .select({
        id: stylists.id,
        salonId: stylists.salonId,
        userId: stylists.userId,
        displayName: stylists.displayName,
        avatarUrl: stylists.avatarUrl,
        active: stylists.active,
        isApprentice: stylists.isApprentice,
        createdAt: stylists.createdAt,
        updatedAt: stylists.updatedAt,
        user: users,
      })
      .from(stylists)
      .innerJoin(users, eq(stylists.userId, users.id))
      .where(eq(stylists.salonId, salonId));
  }

  async getStylist(id: string): Promise<(Stylist & { user: User }) | undefined> {
    const [stylist] = await db
      .select({
        id: stylists.id,
        salonId: stylists.salonId,
        userId: stylists.userId,
        displayName: stylists.displayName,
        avatarUrl: stylists.avatarUrl,
        active: stylists.active,
        isApprentice: stylists.isApprentice,
        createdAt: stylists.createdAt,
        updatedAt: stylists.updatedAt,
        user: users,
      })
      .from(stylists)
      .innerJoin(users, eq(stylists.userId, users.id))
      .where(eq(stylists.id, id));
    return stylist;
  }

  async createStylist(stylist: InsertStylist): Promise<Stylist> {
    const [newStylist] = await db.insert(stylists).values(stylist).returning();
    return newStylist;
  }

  async updateStylist(id: string, stylist: Partial<InsertStylist>): Promise<Stylist> {
    const [updatedStylist] = await db
      .update(stylists)
      .set({ ...stylist, updatedAt: new Date() })
      .where(eq(stylists.id, id))
      .returning();
    return updatedStylist;
  }

  async deleteStylist(id: string): Promise<void> {
    await db.delete(stylists).where(eq(stylists.id, id));
  }

  // Work hours operations
  async getWorkHoursByStylist(stylistId: string): Promise<WorkHour[]> {
    return await db.select().from(workHours).where(eq(workHours.stylistId, stylistId));
  }

  async createWorkHours(workHour: Omit<WorkHour, 'id' | 'createdAt'>): Promise<WorkHour> {
    const [newWorkHour] = await db.insert(workHours).values(workHour).returning();
    return newWorkHour;
  }

  // Booking operations
  async getBookingsByUser(userId: string): Promise<BookingWithDetails[]> {
    return await db
      .select({
        id: bookings.id,
        salonId: bookings.salonId,
        customerId: bookings.customerId,
        stylistId: bookings.stylistId,
        serviceId: bookings.serviceId,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        note: bookings.note,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: users,
        stylist: stylists,
        service: services,
        salon: salons,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(eq(bookings.customerId, userId))
      .orderBy(desc(bookings.startsAt)) as BookingWithDetails[];
  }

  async getBookingsBySalon(salonId: string): Promise<BookingWithDetails[]> {
    return await db
      .select({
        id: bookings.id,
        salonId: bookings.salonId,
        customerId: bookings.customerId,
        stylistId: bookings.stylistId,
        serviceId: bookings.serviceId,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        note: bookings.note,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: users,
        stylist: stylists,
        service: services,
        salon: salons,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(eq(bookings.salonId, salonId))
      .orderBy(desc(bookings.startsAt)) as BookingWithDetails[];
  }

  async getBookingsByStylist(stylistId: string): Promise<BookingWithDetails[]> {
    return await db
      .select({
        id: bookings.id,
        salonId: bookings.salonId,
        customerId: bookings.customerId,
        stylistId: bookings.stylistId,
        serviceId: bookings.serviceId,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        note: bookings.note,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: users,
        stylist: stylists,
        service: services,
        salon: salons,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(eq(bookings.stylistId, stylistId))
      .orderBy(asc(bookings.startsAt)) as BookingWithDetails[];
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const [booking] = await db
      .select({
        id: bookings.id,
        salonId: bookings.salonId,
        customerId: bookings.customerId,
        stylistId: bookings.stylistId,
        serviceId: bookings.serviceId,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        note: bookings.note,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: users,
        stylist: stylists,
        service: services,
        salon: salons,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(eq(bookings.id, id)) as BookingWithDetails[];
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // overlap check: existing bookings for stylist intersecting time range
    if (booking.stylistId) {
      const conflicts = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.stylistId, booking.stylistId),
            lt(bookings.startsAt, booking.endsAt),
            gt(bookings.endsAt, booking.startsAt),
            ne(bookings.status, "cancelled")
          )
        );
      if (conflicts.length > 0) {
        throw new Error("OVERLAP");
      }
    }

    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async seedDemo() {
    const salonsData = [
      {
        name: "BARBERs Freiberg",
        slug: "barbers-freiberg",
        address: "09599 Freiberg, DE",
        lat: "50.9159",
        lng: "13.3422",
        phone: "+49 3731 123456",
        email: "barbers@salonmanager.app",
        openHoursJson: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "18:00" },
          saturday: { start: "10:00", end: "14:00" },
          sunday: null,
        },
      },
      {
        name: "Haarschneiderei Freiberg",
        slug: "haarschneiderei-freiberg",
        address: "09599 Freiberg, DE",
        lat: "50.9166",
        lng: "13.3440",
        phone: "+49 3731 654321",
        email: "haarschneiderei@salonmanager.app",
        openHoursJson: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "18:00" },
          saturday: { start: "10:00", end: "14:00" },
          sunday: null,
        },
      },
      {
        name: "Klier Freiberg",
        slug: "klier-freiberg",
        address: "09599 Freiberg, DE",
        lat: "50.9149",
        lng: "13.3407",
        phone: "+49 3731 987654",
        email: "klier@salonmanager.app",
        openHoursJson: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "18:00" },
          saturday: { start: "10:00", end: "14:00" },
          sunday: null,
        },
      },
    ];

    for (const salonData of salonsData) {
      await db.insert(salons).values(salonData).onConflictDoNothing();
      const [salon] = await db
        .select()
        .from(salons)
        .where(eq(salons.slug, salonData.slug));

      const servicesData = [
        { salonId: salon.id, title: "Herrenhaarschnitt", durationMin: 60, priceCents: 6000 },
        { salonId: salon.id, title: "Damenschnitt", durationMin: 60, priceCents: 6000 },
        { salonId: salon.id, title: "Färben", durationMin: 60, priceCents: 6000 },
      ];

      for (const serviceData of servicesData) {
        await db.insert(services).values(serviceData).onConflictDoNothing();
      }
    }
  }

  // Slot operations
  async findSlots(
    salonId: string,
    serviceId: string,
    date: string,
    stylistId?: string,
  ): Promise<{ start: string; end: string; stylistId: string }[]> {
    const service = await this.getService(serviceId);
    if (!service) return [];

    const salonStylists = stylistId
      ? [await this.getStylist(stylistId)].filter(Boolean)
      : await this.getStylistsBySalon(salonId);

    const slots: { start: string; end: string; stylistId: string }[] = [];
    const dateObj = new Date(date);
    const weekday = dateObj.getDay();

    for (const stylist of salonStylists) {
      if (!stylist) continue;

      // Get work hours for this stylist on this weekday
      const stylistWorkHours = await db
        .select()
        .from(workHours)
        .where(and(
          eq(workHours.stylistId, stylist.id),
          eq(workHours.weekday, weekday)
        ));

      if (stylistWorkHours.length === 0) continue;

      for (const workHour of stylistWorkHours) {
        // Generate 15-minute slots
        const startTime = new Date(`${date}T${workHour.startTime}`);
        const endTime = new Date(`${date}T${workHour.endTime}`);

        let currentTime = new Date(startTime);
        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + (service.durationMin + 5) * 60000);
          if (slotEndTime <= endTime) {
            // Check for conflicts with existing bookings
            const conflictingBookings = await db
              .select()
              .from(bookings)
              .where(and(
                eq(bookings.stylistId, stylist.id),
                lt(bookings.startsAt, slotEndTime),
                gt(bookings.endsAt, currentTime),
                or(
                  eq(bookings.status, "confirmed"),
                  eq(bookings.status, "requested")
                )
              ));

            if (conflictingBookings.length === 0) {
              slots.push({
                start: currentTime.toISOString(),
                end: slotEndTime.toISOString(),
                stylistId: stylist.id,
              });
            }
          }
          currentTime = new Date(currentTime.getTime() + 15 * 60000); // 15 minutes
        }
      }
    }
    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }

  // compatibility alias for previous name
  async getAvailableSlots(
    salonId: string,
    serviceId: string,
    date: string,
    stylistId?: string,
  ) {
    return this.findSlots(salonId, serviceId, date, stylistId);
  }

  // alias helpers matching handover task names
  async listBookingsForUser(userId: string) {
    return this.getBookingsByUser(userId);
  }

  async listBookingsForSalon(salonId: string) {
    return this.getBookingsBySalon(salonId);
  }

  async updateBookingStatus(id: string, status: string) {
    return this.updateBooking(id, { status } as Partial<InsertBooking>);
  }
}

export const storage = new DatabaseStorage();
