import { users, rates, collections, products, type User, type InsertUser, type Rate, type InsertRate, type UpdateRate, type Collection, type InsertCollection, type UpdateCollection, type Product, type InsertProduct, type UpdateProduct } from "@shared/schema";
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
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<UpdateProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any for sessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rates: Map<number, Rate>;
  private collections: Map<number, Collection>;
  private products: Map<number, Product>;
  sessionStore: any; // Using any for sessionStore type
  private userIdCounter: number;
  private rateIdCounter: number;
  private collectionIdCounter: number;
  private productIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rates = new Map();
    this.collections = new Map();
    this.products = new Map();
    this.userIdCounter = 1;
    this.rateIdCounter = 1;
    this.collectionIdCounter = 1;
    this.productIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default rates and collections
    this.initializeRates();
    this.initializeCollections();
    this.initializeProducts();
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
}

export const storage = new MemStorage();
