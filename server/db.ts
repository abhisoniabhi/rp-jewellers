import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { users, rates, collections, products, settings, orders, orderItems, notifications } from "@shared/schema";
import { IStorage, MemStorage } from "./storage";
import { User, InsertUser, Rate, InsertRate, Collection, InsertCollection, Product, InsertProduct, Setting, InsertSetting, Order, InsertOrder, OrderItem, InsertOrderItem, Notification, InsertNotification, UpdateRate, UpdateCollection, UpdateProduct, UpdateSetting } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import pgSessionStore from "connect-pg-simple";
import type { Pool } from "pg";

// Create a SessionStore with connect-pg-simple
const PgSessionStore = pgSessionStore(session);

export class PostgresStorage implements IStorage {
  private db: any;
  private memFallback: MemStorage;
  sessionStore: any;
  private pool: Pool;

  constructor(connectionString: string, pool: any) {
    this.pool = pool;
    
    try {
      // Setup Neon serverless connection
      const sql = neon(connectionString);
      this.db = drizzle(sql as any);
      
      // Setup session store with PostgreSQL
      this.sessionStore = new PgSessionStore({
        pool: this.pool,
        tableName: "session",
        createTableIfMissing: true
      });
      
      // Initialize MemStorage as fallback
      this.memFallback = new MemStorage();
      
      console.log("PostgreSQL database connected successfully");
    } catch (error) {
      console.error("Error connecting to PostgreSQL:", error);
      this.memFallback = new MemStorage();
    }
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where((u: any) => u.id.eq(id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      return this.memFallback.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where((u: any) => u.username.eq(username));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return this.memFallback.getUserByUsername(username);
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const now = new Date().toISOString();
      const newUser = {
        ...user,
        isAdmin: 1, // Make all users admin for simplicity
        createdAt: now
      };
      
      const result = await this.db.insert(users).values(newUser).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createUser:", error);
      return this.memFallback.createUser(user);
    }
  }

  // Rate related methods
  async getRates(): Promise<Rate[]> {
    try {
      const result = await this.db.select().from(rates);
      return result;
    } catch (error) {
      console.error("Error in getRates:", error);
      return this.memFallback.getRates();
    }
  }

  async getRateById(id: number): Promise<Rate | undefined> {
    try {
      const result = await this.db.select().from(rates).where((r: any) => r.id.eq(id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getRateById:", error);
      return this.memFallback.getRateById(id);
    }
  }

  async getRateByType(type: string): Promise<Rate | undefined> {
    try {
      const result = await this.db.select().from(rates).where((r: any) => r.type.eq(type));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getRateByType:", error);
      return this.memFallback.getRateByType(type);
    }
  }

  async createRate(rate: InsertRate): Promise<Rate> {
    try {
      const now = new Date().toLocaleString("en-IN", {
        day: "numeric", 
        month: "short", 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true
      });
      
      const newRate = {
        ...rate,
        updatedAt: now
      };
      
      const result = await this.db.insert(rates).values(newRate).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createRate:", error);
      return this.memFallback.createRate(rate);
    }
  }

  async updateRate(id: number, updateData: Partial<UpdateRate>): Promise<Rate> {
    try {
      // Get existing rate
      const existingRate = await this.getRateById(id);
      if (!existingRate) {
        throw new Error(`Rate with id ${id} not found`);
      }
      
      const now = new Date().toLocaleString("en-IN", {
        day: "numeric", 
        month: "short", 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true
      });
      
      // Auto-calculate high and low based on the current update
      const currentRate = updateData.current !== undefined ? updateData.current : existingRate.current;
      
      // Update high if current rate is higher than existing high
      const newHigh = currentRate > existingRate.high ? currentRate : existingRate.high;
      
      // Update low if current rate is lower than existing low
      const newLow = currentRate < existingRate.low ? currentRate : existingRate.low;
      
      const updatedValues = {
        ...updateData,
        high: newHigh,
        low: newLow,
        updatedAt: now
      };
      
      const result = await this.db.update(rates)
        .set(updatedValues)
        .where((r: any) => r.id.eq(id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error in updateRate:", error);
      return this.memFallback.updateRate(id, updateData);
    }
  }

  // Collection related methods
  async getCollections(): Promise<Collection[]> {
    try {
      const result = await this.db.select().from(collections);
      return result;
    } catch (error) {
      console.error("Error in getCollections:", error);
      return this.memFallback.getCollections();
    }
  }

  async getCollectionById(id: number): Promise<Collection | undefined> {
    try {
      const result = await this.db.select().from(collections).where((c: any) => c.id.eq(id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getCollectionById:", error);
      return this.memFallback.getCollectionById(id);
    }
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    try {
      const now = new Date().toISOString();
      
      const newCollection = {
        ...collection,
        createdAt: now
      };
      
      const result = await this.db.insert(collections).values(newCollection).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createCollection:", error);
      return this.memFallback.createCollection(collection);
    }
  }

  async updateCollection(id: number, updateData: Partial<UpdateCollection>): Promise<Collection> {
    try {
      const existingCollection = await this.getCollectionById(id);
      if (!existingCollection) {
        throw new Error(`Collection with id ${id} not found`);
      }
      
      const result = await this.db.update(collections)
        .set(updateData)
        .where((c: any) => c.id.eq(id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error in updateCollection:", error);
      return this.memFallback.updateCollection(id, updateData);
    }
  }

  async deleteCollection(id: number): Promise<boolean> {
    try {
      // First, delete related products
      await this.db.delete(products).where((p: any) => p.collectionId.eq(id));
      
      // Then delete the collection
      const result = await this.db.delete(collections).where((c: any) => c.id.eq(id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteCollection:", error);
      return this.memFallback.deleteCollection(id);
    }
  }

  // Product related methods
  async getProducts(): Promise<Product[]> {
    try {
      const result = await this.db.select().from(products);
      return result;
    } catch (error) {
      console.error("Error in getProducts:", error);
      return this.memFallback.getProducts();
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      const result = await this.db.select().from(products).where((p: any) => p.id.eq(id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getProductById:", error);
      return this.memFallback.getProductById(id);
    }
  }

  async getProductsByCollectionId(collectionId: number): Promise<Product[]> {
    try {
      const result = await this.db.select().from(products).where((p: any) => p.collectionId.eq(collectionId));
      return result;
    } catch (error) {
      console.error("Error in getProductsByCollectionId:", error);
      return this.memFallback.getProductsByCollectionId(collectionId);
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchTerm = `%${query}%`;
      const result = await this.db.select().from(products)
        .where((p: any) => p.name.like(searchTerm).or(p.description.like(searchTerm)));
      return result;
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return this.memFallback.searchProducts(query);
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const now = new Date().toISOString();
      
      const newProduct = {
        ...product,
        createdAt: now
      };
      
      const result = await this.db.insert(products).values(newProduct).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createProduct:", error);
      return this.memFallback.createProduct(product);
    }
  }

  async updateProduct(id: number, updateData: Partial<UpdateProduct>): Promise<Product> {
    try {
      const existingProduct = await this.getProductById(id);
      if (!existingProduct) {
        throw new Error(`Product with id ${id} not found`);
      }
      
      const result = await this.db.update(products)
        .set(updateData)
        .where((p: any) => p.id.eq(id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error in updateProduct:", error);
      return this.memFallback.updateProduct(id, updateData);
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(products).where((p: any) => p.id.eq(id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      return this.memFallback.deleteProduct(id);
    }
  }

  // Settings related methods
  async getSettings(): Promise<Setting[]> {
    try {
      const result = await this.db.select().from(settings);
      return result;
    } catch (error) {
      console.error("Error in getSettings:", error);
      return this.memFallback.getSettings();
    }
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    try {
      const result = await this.db.select().from(settings).where((s: any) => s.key.eq(key));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getSettingByKey:", error);
      return this.memFallback.getSettingByKey(key);
    }
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    try {
      const now = new Date().toISOString();
      
      const newSetting = {
        ...setting,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await this.db.insert(settings).values(newSetting).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createSetting:", error);
      return this.memFallback.createSetting(setting);
    }
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.update(settings)
        .set({ value, updatedAt: now })
        .where((s: any) => s.key.eq(key))
        .returning();
        
      if (result.length === 0) {
        throw new Error(`Setting with key ${key} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in updateSetting:", error);
      return this.memFallback.updateSetting(key, value);
    }
  }

  // Order related methods
  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const now = new Date().toISOString();
      
      const newOrder = {
        ...order,
        createdAt: now
      };
      
      const result = await this.db.insert(orders).values(newOrder).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createOrder:", error);
      return this.memFallback.createOrder(order);
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const result = await this.db.select().from(orders);
      return result;
    } catch (error) {
      console.error("Error in getOrders:", error);
      return this.memFallback.getOrders();
    }
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    try {
      const result = await this.db.select().from(orders).where((o: any) => o.id.eq(id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getOrderById:", error);
      return this.memFallback.getOrderById(id);
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    try {
      const result = await this.db.select().from(orders).where((o: any) => o.orderNumber.eq(orderNumber));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getOrderByNumber:", error);
      return this.memFallback.getOrderByNumber(orderNumber);
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      const result = await this.db.update(orders)
        .set({ status })
        .where((o: any) => o.id.eq(id))
        .returning();
        
      if (result.length === 0) {
        throw new Error(`Order with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in updateOrderStatus:", error);
      return this.memFallback.updateOrderStatus(id, status);
    }
  }

  // Order items related methods
  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    try {
      const now = new Date().toISOString();
      
      const newOrderItem = {
        ...item,
        createdAt: now
      };
      
      const result = await this.db.insert(orderItems).values(newOrderItem).returning();
      return result[0];
    } catch (error) {
      console.error("Error in addOrderItem:", error);
      return this.memFallback.addOrderItem(item);
    }
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    try {
      const result = await this.db.select().from(orderItems).where((oi: any) => oi.orderId.eq(orderId));
      return result;
    } catch (error) {
      console.error("Error in getOrderItems:", error);
      return this.memFallback.getOrderItems(orderId);
    }
  }

  // Notification related methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const now = new Date().toISOString();
      
      const newNotification = {
        ...notification,
        createdAt: now
      };
      
      const result = await this.db.insert(notifications).values(newNotification).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createNotification:", error);
      return this.memFallback.createNotification(notification);
    }
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    try {
      const result = await this.db.select().from(notifications)
        .where((n: any) => n.userId.eq(userId))
        .orderBy((n: any) => n.createdAt, "desc");
      return result;
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return this.memFallback.getNotifications(userId);
    }
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    try {
      const result = await this.db.select().from(notifications)
        .where((n: any) => n.userId.eq(userId).and(n.read.eq(0)))
        .orderBy((n: any) => n.createdAt, "desc");
      return result;
    } catch (error) {
      console.error("Error in getUnreadNotifications:", error);
      return this.memFallback.getUnreadNotifications(userId);
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    try {
      const result = await this.db.update(notifications)
        .set({ read: 1 })
        .where((n: any) => n.id.eq(id))
        .returning();
        
      if (result.length === 0) {
        throw new Error(`Notification with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error);
      return this.memFallback.markNotificationAsRead(id);
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(notifications).where((n: any) => n.id.eq(id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteNotification:", error);
      return this.memFallback.deleteNotification(id);
    }
  }

  // Migration utilities
  async initializeDatabase(): Promise<void> {
    try {
      console.log("Checking database and initializing if necessary...");
      
      // Check if rates exist
      const ratesExist = await this.db.select().from(rates).limit(1);
      // Check if collections exist
      const collectionsExist = await this.db.select().from(collections).limit(1);
      // Check if products exist
      const productsExist = await this.db.select().from(products).limit(1);
      // Check if settings exist
      const settingsExist = await this.db.select().from(settings).limit(1);
      
      console.log(`Database check: Rates (${ratesExist.length}), Collections (${collectionsExist.length}), Products (${productsExist.length}), Settings (${settingsExist.length})`);
      
      // Initialize with default data where needed 
      
      // Copy data from memFallback only as needed
      if (ratesExist.length === 0) {
        console.log("Initializing rates with default data...");
        const memRates = await this.memFallback.getRates();
        for (const rate of memRates) {
          const { id, ...rateData } = rate;
          await this.db.insert(rates).values(rateData);
        }
      }
      
      if (collectionsExist.length === 0) {
        console.log("Initializing collections with default data...");
        const memCollections = await this.memFallback.getCollections();
        for (const collection of memCollections) {
          const { id, ...collectionData } = collection;
          await this.db.insert(collections).values(collectionData);
        }
      }
      
      if (productsExist.length === 0) {
        console.log("Initializing products with default data...");
        const memProducts = await this.memFallback.getProducts();
        for (const product of memProducts) {
          const { id, ...productData } = product;
          await this.db.insert(products).values(productData);
        }
      }
      
      if (settingsExist.length === 0) {
        console.log("Initializing settings with default data...");
        const memSettings = await this.memFallback.getSettings();
        for (const setting of memSettings) {
          const { key, value } = setting;
          await this.db.insert(settings).values({ key, value });
        }
      }
      
      console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error; // Rethrow to allow caller to handle
    }
  }
}

// DB Connection utilities
export async function initPool(connectionString: string): Promise<any> {
  try {
    // For local development, use with pg
    // Dynamic import for pg since we're using ESM
    const pg = await import("pg");
    const Pool = pg.default.Pool;
    
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      // Add shorter connection timeout
      connectionTimeoutMillis: 5000, // 5 seconds timeout
      query_timeout: 10000, // 10 seconds query timeout
      idle_in_transaction_session_timeout: 10000 // 10 seconds idle timeout
    });
    
    // Test the connection with a timeout
    const connectionTestPromise = pool.query("SELECT NOW()");
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout")), 5000)
    );
    
    await Promise.race([connectionTestPromise, timeoutPromise]);
    console.log("Database pool connected successfully");
    return pool;
  } catch (error) {
    console.error("Error creating database pool:", error);
    throw error;
  }
}

// Database initialization function
export async function createStorage(connectionString?: string): Promise<IStorage> {
  if (!connectionString) {
    console.log("No database connection string provided, using in-memory storage");
    return new MemStorage();
  }
  
  try {
    console.log("Attempting to connect to PostgreSQL database...");
    
    // Initialize the pool with a shorter connection timeout
    const pool = await initPool(connectionString);
    
    // Create PostgreSQL storage
    const pgStorage = new PostgresStorage(connectionString, pool);
    
    // Initialize database with default data if needed
    await pgStorage.initializeDatabase();
    
    console.log("Successfully connected to PostgreSQL database");
    return pgStorage;
  } catch (error) {
    console.error("Failed to initialize PostgreSQL storage, falling back to in-memory storage:", error);
    
    // For deployment to Render, this error handling is important 
    // In development on Replit, we'll use in-memory storage
    console.log("Using in-memory storage as fallback");
    
    // Return in-memory storage
    return new MemStorage();
  }
}