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
  type BookingWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, asc, lt, gt, ne, inArray } from "drizzle-orm";

const TZ = "Europe/Berlin";
const SLOT_STEP_MIN = 15;
const BUFFER_MIN = 5;

function offsetForTZ(base: Date, tz: string): string {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  });
  const m =
    f
      .formatToParts(base)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  const sign = m.includes("-") ? "-" : "+";
  const [h, mi] = m.split(sign)[1].split(":");
  return `${sign}${h.padStart(2, "0")}:${mi.padStart(2, "0")}`;
}

function toZoned(dateISO: string, timeHHmm: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  const val = (t: string) => parts.find((p) => p.type === t)?.value!;
  return new Date(
    `${val("year")}-${val("month")}-${val("day")}T${val("hour")}:${val(
      "minute"
    )}:00${offsetForTZ(new Date(), TZ)}`,
  );
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function iterateSlots(
  windowStart: Date,
  windowEnd: Date,
  durationMin: number,
): Array<[Date, Date]> {
  const endPlus = durationMin + BUFFER_MIN;
  const slots: Array<[Date, Date]> = [];
  for (
    let t = new Date(windowStart);
    addMinutes(t, endPlus) <= windowEnd;
    t = addMinutes(t, SLOT_STEP_MIN)
  ) {
    const e = addMinutes(t, endPlus);
    slots.push([new Date(t), e]);
  }
  return slots;
}

function parseISO(iso: string): Date {
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error('invalid ISO date');
  return d;
}

function endFromStart(startISO: string, durationMin: number): string {
  const s = parseISO(startISO);
  const e = new Date(s.getTime() + (durationMin + BUFFER_MIN) * 60_000);
  return e.toISOString();
}

function within(a: Date, b: Date, x: Date) {
  return a.getTime() <= x.getTime() && x.getTime() <= b.getTime();
}

function timeWithinWorkHours(
  dateISO: string,
  stylistId: number,
  start: Date,
  end: Date,
  workHours: Array<{ weekday: number; start: string; end: string; stylist_id: number }>
): boolean {
  const weekday = start.getDay();
  const rules = workHours.filter(w => w.stylist_id === stylistId && w.weekday === weekday);
  if (rules.length === 0) return false;
  return rules.some(rule => {
    const wStart = toZoned(dateISO, rule.start);
    const wEnd = toZoned(dateISO, rule.end);
    return wStart <= start && end <= wEnd;
  });
}

function overlapsRange(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export type SalonListItem = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  services: Array<{ id: string; title: string; price_cents: number }>;
};

export type SalonDetail = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone?: string | null;
  email?: string | null;
  open_hours_json?: any | null;
  services: Array<{
    id: string;
    title: string;
    duration_min: number;
    price_cents: number;
    active: boolean;
  }>;
  stylists: Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    active: boolean;
  }>;
};

export type BookingListItem = {
  id: number;
  salon_id: number;
  service: { id: number; title: string; duration_min: number; price_cents: number };
  stylist: { id: number; display_name: string | null };
  customer: { id: number | null; name: string | null };
  starts_at: string;
  ends_at: string;
  status: 'requested' | 'confirmed' | 'declined' | 'cancelled';
  note: string | null;
};

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Salon operations
  getSalons(): Promise<SalonListItem[]>;
  getSalon(id: number): Promise<SalonDetail | null>;
  getSalonBySlug(slug: string): Promise<SalonDetail | null>;
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
  createBooking(params: {
    salonId: number;
    customerId?: number | null;
    serviceId: number;
    stylistId?: number | null;
    startsAtISO: string;
    note?: string | null;
  }): Promise<
    | { ok: true; booking: { [k: string]: any } }
    | { ok: false; status: number; error: Record<string, string[]> }
  >;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;

  listBookings(params: {
    scope: 'me' | 'salon';
    salonId?: number;
    customerId?: number | null;
    fromISO?: string;
    toISO?: string;
    status?: 'requested' | 'confirmed' | 'declined' | 'cancelled';
    limit?: number;
    offset?: number;
  }): Promise<BookingListItem[]>;

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
  async getSalons(): Promise<SalonListItem[]> {
    const salonRows = await db
      .select({
        id: salons.id,
        name: salons.name,
        slug: salons.slug,
        address: salons.address,
        lat: salons.lat,
        lng: salons.lng,
      })
      .from(salons);

    if (salonRows.length === 0) return [];

    const serviceRows = await db
      .select({
        id: services.id,
        salonId: services.salonId,
        title: services.title,
        price_cents: services.priceCents,
      })
      .from(services)
      .where(inArray(services.salonId, salonRows.map((s) => s.id)));

    const serviceMap = new Map<string, { id: string; title: string; price_cents: number }[]>();
    for (const row of serviceRows) {
      if (!serviceMap.has(row.salonId)) serviceMap.set(row.salonId, []);
      serviceMap.get(row.salonId)!.push({
        id: row.id,
        title: row.title,
        price_cents: row.price_cents,
      });
    }

    return salonRows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      address: s.address,
      lat: s.lat !== null ? Number(s.lat) : null,
      lng: s.lng !== null ? Number(s.lng) : null,
      services: (serviceMap.get(s.id) ?? []).slice(0, 3),
    }));
  }

  async getSalon(id: number): Promise<SalonDetail | null> {
    const idStr = String(id);
    const [salon] = await db
      .select({
        id: salons.id,
        name: salons.name,
        slug: salons.slug,
        address: salons.address,
        lat: salons.lat,
        lng: salons.lng,
        phone: salons.phone,
        email: salons.email,
        open_hours_json: salons.openHoursJson,
      })
      .from(salons)
      .where(eq(salons.id, idStr));

    if (!salon) return null;

    const serviceRows = await db
      .select({
        id: services.id,
        title: services.title,
        duration_min: services.durationMin,
        price_cents: services.priceCents,
        active: services.active,
      })
      .from(services)
      .where(eq(services.salonId, idStr));

    const stylistRows = await db
      .select({
        id: stylists.id,
        display_name: stylists.displayName,
        avatar_url: stylists.avatarUrl,
        active: stylists.active,
      })
      .from(stylists)
      .where(eq(stylists.salonId, idStr));

    return {
      ...salon,
      lat: salon.lat !== null ? Number(salon.lat) : null,
      lng: salon.lng !== null ? Number(salon.lng) : null,
      services: serviceRows.map((s) => ({
        id: s.id,
        title: s.title,
        duration_min: s.duration_min,
        price_cents: s.price_cents,
        active: s.active,
      })),
      stylists: stylistRows.map((s) => ({
        id: s.id,
        display_name: s.display_name,
        avatar_url: s.avatar_url,
        active: s.active,
      })),
    };
  }

  async getSalonBySlug(slug: string): Promise<SalonDetail | null> {
    const [salon] = await db.select().from(salons).where(eq(salons.slug, slug));
    if (!salon) return null;
    return this.getSalon(Number(salon.id));
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

  async listBookings(params: {
    scope: 'me' | 'salon';
    salonId?: number;
    customerId?: number | null;
    fromISO?: string;
    toISO?: string;
    status?: 'requested' | 'confirmed' | 'declined' | 'cancelled';
    limit?: number;
    offset?: number;
  }): Promise<BookingListItem[]> {
    const {
      scope,
      salonId,
      customerId,
      fromISO,
      toISO,
      status,
      limit = 50,
      offset = 0,
    } = params;

    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const defaultTo = new Date(defaultFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
    const from = fromISO ? new Date(`${fromISO}T00:00:00`) : defaultFrom;
    const to = toISO ? new Date(`${toISO}T23:59:59`) : defaultTo;

    if (scope === 'me') {
      if (!customerId) return [];
    } else if (scope === 'salon') {
      if (!salonId) return [];
    }

    const conditions: any[] = [
      scope === 'me'
        ? eq(bookings.customerId, String(customerId))
        : eq(bookings.salonId, String(salonId)),
      gte(bookings.startsAt, from),
      lte(bookings.startsAt, to),
    ];
    if (status) conditions.push(eq(bookings.status, status));

    const rows = await db
      .select({
        id: bookings.id,
        salonId: bookings.salonId,
        serviceId: bookings.serviceId,
        serviceTitle: services.title,
        serviceDuration: services.durationMin,
        servicePrice: services.priceCents,
        stylistId: bookings.stylistId,
        stylistName: stylists.displayName,
        customerId: bookings.customerId,
        customerFirst: users.firstName,
        customerLast: users.lastName,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        note: bookings.note,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(stylists, eq(bookings.stylistId, stylists.id))
      .leftJoin(users, eq(bookings.customerId, users.id))
      .where(and(...conditions))
      .orderBy(asc(bookings.startsAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      id: Number(r.id),
      salon_id: Number(r.salonId),
      service: {
        id: Number(r.serviceId),
        title: r.serviceTitle,
        duration_min: r.serviceDuration,
        price_cents: r.servicePrice,
      },
      stylist: { id: Number(r.stylistId), display_name: r.stylistName },
      customer: {
        id: r.customerId ? Number(r.customerId) : null,
        name:
          r.customerFirst || r.customerLast
            ? `${r.customerFirst ?? ''} ${r.customerLast ?? ''}`.trim()
            : r.customerId
            ? null
            : 'Gast',
      },
      starts_at: r.startsAt.toISOString(),
      ends_at: r.endsAt.toISOString(),
      status: r.status,
      note: r.note ?? null,
    }));
  }

  async createBooking(params: {
    salonId: number;
    customerId?: number | null;
    serviceId: number;
    stylistId?: number | null;
    startsAtISO: string;
    note?: string | null;
  }): Promise<
    | { ok: true; booking: { [k: string]: any } }
    | { ok: false; status: number; error: Record<string, string[]> }
  > {
    const { salonId, customerId = null, serviceId, stylistId, startsAtISO, note = null } = params;

    const svc = await db.query.services.findFirst({
      where: (s, { and, eq }) => and(eq(s.id, String(serviceId)), eq(s.salonId, String(salonId)))
    });
    if (!svc || !svc.active) {
      return { ok: false, status: 422, error: { service_id: ['not found in salon or inactive'] } };
    }

    let startsAt: Date;
    try {
      startsAt = parseISO(startsAtISO);
    } catch {
      return { ok: false, status: 422, error: { starts_at: ['invalid ISO datetime'] } };
    }
    const now = new Date();
    if (startsAt.getTime() <= now.getTime()) {
      return { ok: false, status: 422, error: { starts_at: ['must be in the future'] } };
    }
    const endsAtISO = endFromStart(startsAtISO, svc.durationMin ?? 60);
    const endsAt = parseISO(endsAtISO);

    let stylists: Array<{ id: string }> = [];
    if (stylistId) {
      const st = await db.query.stylists.findFirst({
        where: (st, { and, eq }) => and(eq(st.id, String(stylistId)), eq(st.salonId, String(salonId)), eq(st.active, true))
      });
      if (!st) return { ok: false, status: 422, error: { stylist_id: ['not found in salon or inactive'] } };
      stylists = [{ id: st.id }];
    } else {
      stylists = await db.query.stylists.findMany({
        where: (st, { and, eq }) => and(eq(st.salonId, String(salonId)), eq(st.active, true))
      });
      if (stylists.length === 0) {
        return { ok: false, status: 422, error: { stylist_id: ['no active stylist in salon'] } };
      }
    }

    const dateISO = startsAtISO.slice(0, 10);
    const weekday = startsAt.getDay();

    const workHoursData = await db.query.workHours.findMany({
      where: (w, { and, eq, inArray }) => and(
        eq(w.salonId, String(salonId)),
        eq(w.weekday, weekday),
        inArray(w.stylistId, stylists.map(s => s.id))
      )
    });
    const workHoursRows = workHoursData.map(w => ({
      weekday: w.weekday,
      start: w.startTime,
      end: w.endTime,
      stylist_id: w.stylistId,
    }));

    const dayStart = toZoned(dateISO, '00:00');
    const dayEnd = toZoned(dateISO, '23:59');

    const absencesRows = await db.query.absences.findMany({
      where: (a, { and, eq, gte, lte, inArray }) => and(
        eq(a.salonId, String(salonId)),
        inArray(a.stylistId, stylists.map(s => s.id)),
        lte(a.startsAt, dayEnd),
        gte(a.endsAt, dayStart)
      )
    });

    const bookingsRows = await db.query.bookings.findMany({
      where: (b, { and, eq, ne, gte, lte, inArray }) => and(
        eq(b.salonId, String(salonId)),
        inArray(b.stylistId, stylists.map(s => s.id)),
        ne(b.status, 'cancelled'),
        lte(b.startsAt, dayEnd),
        gte(b.endsAt, dayStart)
      )
    });

    let chosenStylistId: string | null = stylistId ? String(stylistId) : null;
    if (!chosenStylistId) {
      for (const st of stylists) {
        const inWH = timeWithinWorkHours(dateISO, Number(st.id), startsAt, endsAt, workHoursRows as any);
        if (!inWH) continue;
        const absent = absencesRows.some(a => a.stylistId === st.id && overlapsRange(startsAt, endsAt, new Date(a.startsAt), new Date(a.endsAt)));
        if (absent) continue;
        const hasOverlap = bookingsRows.some(b => b.stylistId === st.id && overlapsRange(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)));
        if (hasOverlap) continue;
        chosenStylistId = st.id;
        break;
      }
      if (!chosenStylistId) {
        return { ok: false, status: 422, error: { starts_at: ['no free stylist at this time'] } };
      }
    } else {
      const inWH = timeWithinWorkHours(dateISO, Number(chosenStylistId), startsAt, endsAt, workHoursRows as any);
      if (!inWH) return { ok: false, status: 422, error: { starts_at: ['outside work hours'] } };
      const absent = absencesRows.some(a => a.stylistId === chosenStylistId && overlapsRange(startsAt, endsAt, new Date(a.startsAt), new Date(a.endsAt)));
      if (absent) return { ok: false, status: 422, error: { starts_at: ['stylist absent'] } };
      const hasOverlap = bookingsRows.some(b => b.stylistId === chosenStylistId && overlapsRange(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)));
      if (hasOverlap) return { ok: false, status: 422, error: { starts_at: ['overlaps existing booking'] } };
    }

    const inserted = await db.insert(bookings).values({
      salonId: String(salonId),
      customerId: (customerId ? String(customerId) : null) as any,
      stylistId: chosenStylistId!,
      serviceId: String(serviceId),
      startsAt,
      endsAt,
      status: 'requested',
      note,
    } as any).returning();

    const b = inserted[0];
    return { ok: true, booking: {
      booking_id: b.id,
      salon_id: b.salonId,
      service_id: b.serviceId,
      stylist_id: b.stylistId,
      customer_id: b.customerId,
      starts_at: b.startsAt,
      ends_at: b.endsAt,
      status: b.status,
      note: b.note,
    }};
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
    const svc = await this.getService(serviceId);
    if (!svc || !svc.active) return [];

    const stylists = stylistId
      ? [await this.getStylist(stylistId)].filter(Boolean as any)
      : await this.getStylistsBySalon(salonId);
    if (stylists.length === 0) return [];

    const weekday = new Date(
      `${date}T00:00:00${offsetForTZ(new Date(), TZ)}`,
    ).getDay();

    const wh = await db
      .select()
      .from(workHours)
      .where(
        and(
          eq(workHours.salonId, salonId),
          eq(workHours.weekday, weekday),
          inArray(workHours.stylistId, stylists.map((s) => s!.id)),
        ),
      );
    if (wh.length === 0) return [];

    const dayStart = toZoned(date, "00:00");
    const dayEnd = toZoned(date, "23:59");

    const abs = await db
      .select()
      .from(absences)
      .where(
        and(
          eq(absences.salonId, salonId),
          inArray(absences.stylistId, stylists.map((s) => s!.id)),
          lte(absences.startsAt, dayEnd),
          gte(absences.endsAt, dayStart),
        ),
      );

    const bks = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.salonId, salonId),
          inArray(bookings.stylistId, stylists.map((s) => s!.id)),
          ne(bookings.status, "cancelled"),
          lte(bookings.startsAt, dayEnd),
          gte(bookings.endsAt, dayStart),
        ),
      );

    const out: { start: string; end: string; stylistId: string }[] = [];

    for (const rule of wh) {
      const stId = rule.stylistId;
      const winStart = toZoned(date, rule.startTime);
      const winEnd = toZoned(date, rule.endTime);
      if (winStart >= winEnd) continue;

      const absFor = abs.filter((a) => a.stylistId === stId);
      const bookingsFor = bks.filter((b) => b.stylistId === stId);

      for (const [s, e] of iterateSlots(winStart, winEnd, svc.durationMin)) {
        const blockedByAbs = absFor.some((a) =>
          rangesOverlap(s, e, new Date(a.startsAt), new Date(a.endsAt)),
        );
        if (blockedByAbs) continue;

        const blockedByBooking = bookingsFor.some((b) =>
          rangesOverlap(s, e, new Date(b.startsAt), new Date(b.endsAt)),
        );
        if (blockedByBooking) continue;

        out.push({ start: s.toISOString(), end: e.toISOString(), stylistId: stId });
      }
    }

    out.sort(
      (a, b) => a.start.localeCompare(b.start) || a.stylistId.localeCompare(b.stylistId),
    );
    return out;
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

// --- Services CRUD for Admin ---
export type ServiceInput = {
  title: string;
  duration_min: number;
  price_cents: number;
  active?: boolean;
};

function validateServiceInput(input: Partial<ServiceInput>) {
  const errors: Record<string, string[]> = {};
  if (!input.title || input.title.trim().length < 3) {
    (errors.title ??= []).push('min length 3');
  }
  const dur = Number(input.duration_min);
  if (!Number.isFinite(dur) || dur < 10 || dur > 240) {
    (errors.duration_min ??= []).push('10..240');
  }
  const price = Number(input.price_cents);
  if (!Number.isFinite(price) || price < 0 || price > 500000) {
    (errors.price_cents ??= []).push('0..500000');
  }
  if (input.active != null && typeof input.active !== 'boolean') {
    (errors.active ??= []).push('boolean');
  }
  return errors;
}

export async function listServicesBySalon(salonId: number) {
  return await db.query.services.findMany({
    where: (s, { eq }) => eq(s.salonId, String(salonId)),
    orderBy: (s, { asc }) => [asc(s.title)],
  });
}

export async function createService(salonId: number, input: ServiceInput) {
  const errors = validateServiceInput(input);
  if (Object.keys(errors).length) return { ok: false, status: 422, errors };

  const inserted = await db
    .insert(services)
    .values({
      salonId: String(salonId),
      title: input.title.trim(),
      durationMin: input.duration_min,
      priceCents: input.price_cents,
      active: input.active ?? true,
    })
    .returning();
  return { ok: true, data: inserted[0] };
}

export async function updateService(
  serviceId: number,
  salonId: number,
  input: Partial<ServiceInput>,
) {
  const errors = validateServiceInput({
    title: input.title ?? 'xxx',
    duration_min: input.duration_min ?? 60,
    price_cents: input.price_cents ?? 0,
    active: input.active,
  });
  if (input.title == null) delete errors.title;
  if (input.duration_min == null) delete errors.duration_min;
  if (input.price_cents == null) delete errors.price_cents;
  if (Object.keys(errors).length) return { ok: false, status: 422, errors };

  const existing = await db.query.services.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.id, String(serviceId)), eq(s.salonId, String(salonId))),
  });
  if (!existing)
    return { ok: false, status: 404, errors: { id: ['not found in salon'] } };

  const updated = await db
    .update(services)
    .set({
      title: input.title != null ? input.title.trim() : existing.title,
      durationMin: input.duration_min ?? existing.durationMin,
      priceCents: input.price_cents ?? existing.priceCents,
      active: input.active ?? existing.active,
    })
    .where(eq(services.id, String(serviceId)))
    .returning();

  return { ok: true, data: updated[0] };
}

export async function deleteService(serviceId: number, salonId: number) {
  const existing = await db.query.services.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.id, String(serviceId)), eq(s.salonId, String(salonId))),
  });
  if (!existing)
    return { ok: false, status: 404, errors: { id: ['not found in salon'] } };

  const futureBooking = await db.query.bookings.findFirst({
    where: (b, { and, eq, gt }) =>
      and(eq(b.serviceId, String(serviceId)), gt(b.startsAt, new Date())),
  });
  if (futureBooking)
    return { ok: false, status: 409, errors: { id: ['has future bookings'] } };

  await db.delete(services).where(eq(services.id, String(serviceId)));
  return { ok: true };
}

