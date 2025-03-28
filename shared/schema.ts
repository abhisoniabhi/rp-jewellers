import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Rate model
export const rates = pgTable("rates", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  current: integer("current").notNull(),
  high: integer("high").notNull(),
  low: integer("low").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRateSchema = createInsertSchema(rates).omit({
  id: true,
  updatedAt: true,
});

export const updateRateSchema = createInsertSchema(rates).pick({
  type: true,
  current: true,
  high: true,
  low: true,
  category: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRate = z.infer<typeof insertRateSchema>;
export type UpdateRate = z.infer<typeof updateRateSchema>;
export type Rate = typeof rates.$inferSelect;
