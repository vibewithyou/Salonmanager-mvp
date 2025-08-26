import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  boolean,
  text,
  decimal,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth and role management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["owner", "salon_owner", "stylist", "customer"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salons table
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  openHoursJson: jsonb("open_hours_json"),
  themeJson: jsonb("theme_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stylists table
export const stylists = pgTable("stylists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name").notNull(),
  avatarUrl: varchar("avatar_url"),
  active: boolean("active").notNull().default(true),
  isApprentice: boolean("is_apprentice").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work hours table
export const workHours = pgTable("work_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  stylistId: varchar("stylist_id").notNull().references(() => stylists.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Absences table
export const absences = pgTable("absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  stylistId: varchar("stylist_id").notNull().references(() => stylists.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stylistId: varchar("stylist_id").references(() => stylists.id, { onDelete: "set null" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: varchar("status", { enum: ["requested", "confirmed", "declined", "cancelled"] }).notNull().default("requested"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  stylists: many(stylists),
  bookings: many(bookings),
}));

export const salonsRelations = relations(salons, ({ many }) => ({
  services: many(services),
  stylists: many(stylists),
  workHours: many(workHours),
  absences: many(absences),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  salon: one(salons, {
    fields: [services.salonId],
    references: [salons.id],
  }),
  bookings: many(bookings),
}));

export const stylistsRelations = relations(stylists, ({ one, many }) => ({
  salon: one(salons, {
    fields: [stylists.salonId],
    references: [salons.id],
  }),
  user: one(users, {
    fields: [stylists.userId],
    references: [users.id],
  }),
  workHours: many(workHours),
  absences: many(absences),
  bookings: many(bookings),
}));

export const workHoursRelations = relations(workHours, ({ one }) => ({
  salon: one(salons, {
    fields: [workHours.salonId],
    references: [salons.id],
  }),
  stylist: one(stylists, {
    fields: [workHours.stylistId],
    references: [stylists.id],
  }),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  salon: one(salons, {
    fields: [absences.salonId],
    references: [salons.id],
  }),
  stylist: one(stylists, {
    fields: [absences.stylistId],
    references: [stylists.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  salon: one(salons, {
    fields: [bookings.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  stylist: one(stylists, {
    fields: [bookings.stylistId],
    references: [stylists.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStylistSchema = createInsertSchema(stylists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Salon = typeof salons.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Stylist = typeof stylists.$inferSelect;
export type WorkHour = typeof workHours.$inferSelect;
export type Absence = typeof absences.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Extended types with relations
export type SalonWithDetails = Salon & {
  services: Service[];
  stylists: (Stylist & { user: User })[];
};

export type BookingWithDetails = Booking & {
  customer: User;
  stylist?: Stylist & { user: User };
  service: Service;
  salon: Salon;
};
