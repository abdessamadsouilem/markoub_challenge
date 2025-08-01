import { pgTable, serial, text, boolean, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for authentication and role management
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'dispatcher', 'viewer'] }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Drivers table
export const drivers = pgTable('drivers', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    licenseNumber: text('license_number').notNull().unique(),
    available: boolean('available').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Buses table
export const buses = pgTable('buses', {
    id: serial('id').primaryKey(),
    plateNumber: text('plate_number').notNull().unique(),
    capacity: integer('capacity').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Routes table
export const routes = pgTable('routes', {
    id: serial('id').primaryKey(),
    origin: text('origin').notNull(),
    destination: text('destination').notNull(),
    estimatedDurationMinutes: integer('estimated_duration_minutes').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shifts = pgTable('shifts', {
    id: serial('id').primaryKey(),
    driverId: integer('driver_id').references(() => drivers.id, { onDelete: 'cascade' }).notNull(),
    busId: integer('bus_id').references(() => buses.id, { onDelete: 'cascade' }).notNull(),
    routeId: integer('route_id').references(() => routes.id, { onDelete: 'cascade' }).notNull(),
    shiftDate: text('shift_date').notNull(), // Format: YYYY-MM-DD
    shiftTime: text('shift_time').notNull(), // Format: HH:MM
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueDriverDateTime: unique().on(table.driverId, table.shiftDate, table.shiftTime),
    uniqueBusDateTime: unique().on(table.busId, table.shiftDate, table.shiftTime),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
    driver: one(drivers, {
        fields: [shifts.driverId],
        references: [drivers.id],
    }),
    bus: one(buses, {
        fields: [shifts.busId],
        references: [buses.id],
    }),
    route: one(routes, {
        fields: [shifts.routeId],
        references: [routes.id],
    }),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
    shifts: many(shifts),
}));

export const busesRelations = relations(buses, ({ many }) => ({
    shifts: many(shifts),
}));

export const routesRelations = relations(routes, ({ many }) => ({
    shifts: many(shifts),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;
export type Bus = typeof buses.$inferSelect;
export type NewBus = typeof buses.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

// Extended types with relations for API responses
export type ShiftWithDetails = Shift & {
    driver: Driver;
    bus: Bus;
    route: Route;
}; 