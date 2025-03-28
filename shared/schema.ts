import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin").default(0).notNull(),
  createdAt: text("created_at").notNull(),
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
  updatedAt: text("updated_at").notNull(),
});

export const insertRateSchema = createInsertSchema(rates).omit({
  id: true,
  updatedAt: true,
});

export const updateRateSchema = createInsertSchema(rates).pick({
  type: true,
  current: true,
  category: true,
}).extend({
  category: z.enum(["gold", "silver"]),
  high: z.number().optional(),
  low: z.number().optional()
});

// Collection model
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  featured: integer("featured").default(0).notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const updateCollectionSchema = createInsertSchema(collections).pick({
  name: true,
  description: true,
  imageUrl: true,
  featured: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRate = z.infer<typeof insertRateSchema>;
export type UpdateRate = z.infer<typeof updateRateSchema>;
export type Rate = typeof rates.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
