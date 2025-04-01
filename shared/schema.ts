import { pgTable, text, serial, integer, timestamp, varchar, real } from "drizzle-orm/pg-core";
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
// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  taunch: real("taunch").notNull(), // price in rupees
  weight: real("weight").default(0).notNull(), // weight in grams
  karatType: varchar("karat_type", { length: 10 }).default("22k").notNull(), // 18k or 22k
  category: varchar("category", { length: 50 }).notNull(),
  collectionId: integer("collection_id").notNull(), // foreign key to collection
  featured: integer("featured").default(0).notNull(),
  inStock: integer("in_stock").default(1).notNull(), // 1 for in stock, 0 for out of stock
  createdAt: text("created_at").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const updateProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  imageUrl: true,
  taunch: true,
  weight: true,
  karatType: true,
  category: true,
  collectionId: true,
  featured: true,
  inStock: true,
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Product = typeof products.$inferSelect;
