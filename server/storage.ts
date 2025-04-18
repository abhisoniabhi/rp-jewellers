import { users, rates, collections, products, settings, orders, orderItems, notifications, type User, type InsertUser, type Rate, type InsertRate, type UpdateRate, type Collection, type InsertCollection, type UpdateCollection, type Product, type InsertProduct, type UpdateProduct, type Setting, type InsertSetting, type UpdateSetting, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Notification, type InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rate related methods
  getRates(): Promise<Rate[]>;
  getRateById(id: number): Promise<Rate | undefined>;
  getRateByType(type: string): Promise<Rate | undefined>;
  createRate(rate: InsertRate): Promise<Rate>;
  updateRate(id: number, rate: Partial<Rate>): Promise<Rate>;
  
  // Collection related methods
  getCollections(): Promise<Collection[]>;
  getCollectionById(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<UpdateCollection>): Promise<Collection>;
  deleteCollection(id: number): Promise<boolean>;
  
  // Product related methods
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCollectionId(collectionId: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>; // Search products by name or description
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<UpdateProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Settings related methods
  getSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Order related methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Order items related methods
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Notification related methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any for sessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rates: Map<number, Rate>;
  private collections: Map<number, Collection>;
  private products: Map<number, Product>;
  private settings: Map<string, Setting>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  sessionStore: any; // Using any for sessionStore type
  private userIdCounter: number;
  private rateIdCounter: number;
  private collectionIdCounter: number;
  private productIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rates = new Map();
    this.collections = new Map();
    this.products = new Map();
    this.settings = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userIdCounter = 1;
    this.rateIdCounter = 1;
    this.collectionIdCounter = 1;
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default rates and collections
    this.initializeRates();
    this.initializeCollections();
    this.initializeProducts();
    this.initializeSettings();
  }
  
  private initializeSettings() {
    const defaultSettings: InsertSetting[] = [
      {
        key: "whatsappNumber",
        value: "+919876543210", // Default WhatsApp number
        description: "WhatsApp number for customer inquiries"
      },
      {
        key: "storeLocation",
        value: "28.6139,77.2090", // Default location (New Delhi)
        description: "Store location coordinates (latitude,longitude)"
      },
      {
        key: "storeAddress",
        value: "123 Jewelry Market, New Delhi, India",
        description: "Store physical address"
      },
      {
        key: "storeName",
        value: "Jewel Palace",
        description: "Store name"
      }
    ];
    
    let idCounter = 1;
    defaultSettings.forEach(setting => {
      const now = new Date().toISOString();
      const settingItem: Setting = {
        id: idCounter++,
        key: setting.key,
        value: setting.value,
        description: setting.description || null,
        createdAt: now,
        updatedAt: now
      };
      this.settings.set(setting.key, settingItem);
    });
  }
  
  private initializeRates() {
    const defaultRates: InsertRate[] = [
      {
        type: "नंबर 99.99 Gold",
        current: 91700,
        high: 92000,
        low: 91650,
        icon: "cube",
        category: "gold",
      },
      {
        type: "ब्रैंड 99.50 Gold",
        current: 91250,
        high: 91550,
        low: 91200,
        icon: "chevron-up",
        category: "gold",
      },
      {
        type: "चांदी बट्टिया [99.99]",
        current: 102300,
        high: 102300,
        low: 101100,
        icon: "coin",
        category: "silver",
      },
      {
        type: "RTGS(9999) inc GST",
        current: 92245,
        high: 92425,
        low: 92025,
        icon: "calculator",
        category: "gold",
      },
    ];
    
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric", 
      month: "short", 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true
    });
    
    defaultRates.forEach(rate => {
      const id = this.rateIdCounter++;
      this.rates.set(id, {
        ...rate,
        id,
        updatedAt: now
      } as Rate);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: 1, // Make all users admin for simplicity
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Rate methods
  async getRates(): Promise<Rate[]> {
    return Array.from(this.rates.values());
  }
  
  async getRateById(id: number): Promise<Rate | undefined> {
    return this.rates.get(id);
  }
  
  async getRateByType(type: string): Promise<Rate | undefined> {
    return Array.from(this.rates.values()).find(
      (rate) => rate.type === type,
    );
  }
  
  async createRate(insertRate: InsertRate): Promise<Rate> {
    const id = this.rateIdCounter++;
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric", 
      month: "short", 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true
    });
    
    const rate: Rate = {
      ...insertRate,
      id,
      updatedAt: now
    };
    
    this.rates.set(id, rate);
    return rate;
  }
  
  async updateRate(id: number, updateData: Partial<UpdateRate>): Promise<Rate> {
    const existingRate = this.rates.get(id);
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
    
    const updatedRate: Rate = {
      ...existingRate,
      ...updateData,
      high: newHigh,
      low: newLow,
      updatedAt: now
    };
    
    this.rates.set(id, updatedRate);
    return updatedRate;
  }
  
  // Initialize default collections
  private initializeCollections(): void {
    const defaultCollections: InsertCollection[] = [
      {
        name: "Wedding Collection",
        description: "Exclusive designs for your special day",
        imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        featured: 1
      },
      {
        name: "Traditional Gold",
        description: "Timeless designs inspired by culture",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        featured: 1
      },
      {
        name: "Diamond Jewelry",
        description: "Elegant pieces with premium diamonds",
        imageUrl: "https://images.unsplash.com/photo-1619119712072-f22d10d4dd5c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        featured: 1
      },
      {
        name: "Silver Collection",
        description: "Modern silver designs for daily wear",
        imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
        featured: 1
      },
      {
        name: "Bridal Sets",
        description: "Complete sets for the perfect bridal look",
        imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        featured: 0
      },
      {
        name: "Men's Collection",
        description: "Elegant jewelry designs for men",
        imageUrl: "https://images.unsplash.com/photo-1536243298747-ea8874136d64?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        featured: 0
      }
    ];
    
    const now = new Date().toISOString();
    
    defaultCollections.forEach(collection => {
      const id = this.collectionIdCounter++;
      const collectionItem: Collection = {
        id,
        name: collection.name,
        description: collection.description || null,
        imageUrl: collection.imageUrl,
        featured: collection.featured || 0,
        createdAt: now
      };
      this.collections.set(id, collectionItem);
    });
  }
  
  // Collection methods
  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }
  
  async getCollectionById(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }
  
  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.collectionIdCounter++;
    const now = new Date().toISOString();
    
    // Create collection with proper types
    const collection: Collection = {
      id,
      name: insertCollection.name,
      description: insertCollection.description || null,
      imageUrl: insertCollection.imageUrl,
      featured: insertCollection.featured || 0,
      createdAt: now
    };
    
    this.collections.set(id, collection);
    return collection;
  }
  
  async updateCollection(id: number, updateData: Partial<UpdateCollection>): Promise<Collection> {
    const existingCollection = this.collections.get(id);
    if (!existingCollection) {
      throw new Error(`Collection with id ${id} not found`);
    }
    
    // Handle specific fields with proper types
    const updatedCollection: Collection = {
      ...existingCollection,
      name: updateData.name || existingCollection.name,
      description: updateData.description ?? existingCollection.description,
      imageUrl: updateData.imageUrl || existingCollection.imageUrl,
      featured: typeof updateData.featured === 'number' ? updateData.featured : existingCollection.featured
    };
    
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }
  
  async deleteCollection(id: number): Promise<boolean> {
    if (!this.collections.has(id)) {
      return false;
    }
    
    // Also delete all products in this collection
    const productsToDelete = Array.from(this.products.values())
      .filter(product => product.collectionId === id);
    
    productsToDelete.forEach(product => {
      this.products.delete(product.id);
    });
    
    this.collections.delete(id);
    return true;
  }
  
  // Initialize sample products
  private initializeProducts(): void {
    const sampleProducts: InsertProduct[] = [
      // Wedding Collection products (collection id 1)
      {
        name: "Bridal Gold Necklace",
        description: "Exquisite gold necklace with intricate designs for brides",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        price: 150000,
        weight: 45.5,
        category: "necklace",
        collectionId: 1,
        featured: 1
      },
      {
        name: "Wedding Bangles Set",
        description: "Complete set of gold bangles for wedding ceremonies",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        price: 85000,
        weight: 35.8,
        category: "bangles",
        collectionId: 1,
        featured: 1
      },
      
      // Traditional Gold products (collection id 2)
      {
        name: "Traditional Gold Earrings",
        description: "Classic design inspired by cultural heritage",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        price: 35000,
        weight: 12.5,
        category: "earrings",
        collectionId: 2,
        featured: 0
      },
      {
        name: "Gold Temple Necklace",
        description: "Temple design gold necklace with traditional motifs",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        price: 120000,
        weight: 38.2,
        category: "necklace",
        collectionId: 2,
        featured: 1
      }
    ];
    
    const now = new Date().toISOString();
    
    sampleProducts.forEach(product => {
      const id = this.productIdCounter++;
      const productItem: Product = {
        id,
        name: product.name,
        description: product.description || null,
        imageUrl: product.imageUrl,
        price: product.price,
        weight: product.weight || 0,
        karatType: product.karatType || "22k",
        category: product.category,
        collectionId: product.collectionId,
        featured: product.featured || 0,
        inStock: product.inStock || 1,
        createdAt: now
      };
      this.products.set(id, productItem);
    });
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByCollectionId(collectionId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.collectionId === collectionId);
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    return Array.from(this.products.values())
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        product.category.toLowerCase().includes(searchTerm)
      );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date().toISOString();
    
    // Create product with proper types
    const product: Product = {
      id,
      name: insertProduct.name,
      description: insertProduct.description || null,
      imageUrl: insertProduct.imageUrl,
      price: insertProduct.price,
      weight: insertProduct.weight || 0,
      karatType: insertProduct.karatType || "22k",
      category: insertProduct.category,
      collectionId: insertProduct.collectionId,
      featured: insertProduct.featured || 0,
      inStock: insertProduct.inStock || 1,
      createdAt: now
    };
    
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, updateData: Partial<UpdateProduct>): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    // Handle specific fields with proper types
    const updatedProduct: Product = {
      ...existingProduct,
      name: updateData.name || existingProduct.name,
      description: updateData.description ?? existingProduct.description,
      imageUrl: updateData.imageUrl || existingProduct.imageUrl,
      price: updateData.price ?? existingProduct.price,
      weight: updateData.weight ?? existingProduct.weight,
      karatType: updateData.karatType || existingProduct.karatType,
      category: updateData.category || existingProduct.category,
      collectionId: updateData.collectionId || existingProduct.collectionId,
      featured: typeof updateData.featured === 'number' ? updateData.featured : existingProduct.featured,
      inStock: typeof updateData.inStock === 'number' ? updateData.inStock : existingProduct.inStock
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    if (!this.products.has(id)) {
      return false;
    }
    
    this.products.delete(id);
    return true;
  }
  
  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
  
  async getSettingByKey(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }
  
  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const now = new Date().toISOString();
    // Generate an ID for the new setting (in a real DB, this would be auto-generated)
    const id = Math.max(0, ...Array.from(this.settings.values()).map(s => s.id)) + 1;
    
    const setting: Setting = {
      id,
      key: insertSetting.key,
      value: insertSetting.value,
      description: insertSetting.description || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.settings.set(setting.key, setting);
    return setting;
  }
  
  async updateSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = this.settings.get(key);
    if (!existingSetting) {
      throw new Error(`Setting with key ${key} not found`);
    }
    
    const now = new Date().toISOString();
    
    const updatedSetting: Setting = {
      ...existingSetting,
      value,
      updatedAt: now
    };
    
    this.settings.set(key, updatedSetting);
    return updatedSetting;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date().toISOString();
    
    // Generate a unique order number based on timestamp and id
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${id}`;
    
    const order: Order = {
      id,
      orderNumber,
      customerName: insertOrder.customerName || null,
      customerPhone: insertOrder.customerPhone || null,
      status: insertOrder.status || "pending",
      createdAt: now
    };
    
    this.orders.set(id, order);
    return order;
  }
  
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderNumber === orderNumber
    );
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    const updatedOrder: Order = {
      ...existingOrder,
      status
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order item methods
  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const now = new Date().toISOString();
    
    const orderItem: OrderItem = {
      id,
      orderId: insertOrderItem.orderId,
      productId: insertOrderItem.productId,
      quantity: insertOrderItem.quantity || 1,
      price: insertOrderItem.price,
      createdAt: now
    };
    
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  // Add notification properties to the constructor
  private notifications: Map<number, Notification> = new Map();
  private notificationIdCounter: number = 1;
  
  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date().toISOString();
    
    const newNotification: Notification = {
      id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read || 0,
      userId: notification.userId,
      createdAt: now
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by latest first
  }
  
  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && notification.read === 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by latest first
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    const updatedNotification = { ...notification, read: 1 };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    if (!this.notifications.has(id)) {
      return false;
    }
    
    this.notifications.delete(id);
    return true;
  }
}

export const storage = new MemStorage();
