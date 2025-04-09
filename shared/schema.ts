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
  price: real("price").notNull(),
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
  price: true,
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
// Settings model
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  description: z.string().optional()
});

export const updateSettingSchema = createInsertSchema(settings).pick({
  value: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Product = typeof products.$inferSelect;
// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: text("created_at").notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // foreign key to order
  productId: integer("product_id").notNull(), // foreign key to product
  quantity: integer("quantity").default(1).notNull(),
  price: real("price").notNull(), // price at time of order
  createdAt: text("created_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Notification table to store rate update notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // rate_update, order, etc.
  read: integer("read").default(0).notNull(), // 0 for unread, 1 for read
  userId: integer("user_id").notNull(),  // user to whom the notification belongs
  createdAt: text("created_at").notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
