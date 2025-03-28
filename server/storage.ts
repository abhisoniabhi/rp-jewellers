import { users, rates, type User, type InsertUser, type Rate, type InsertRate, type UpdateRate } from "@shared/schema";
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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rates: Map<number, Rate>;
  sessionStore: session.SessionStore;
  private userIdCounter: number;
  private rateIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rates = new Map();
    this.userIdCounter = 1;
    this.rateIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default rates
    this.initializeRates();
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
    
    const updatedRate: Rate = {
      ...existingRate,
      ...updateData,
      updatedAt: now
    };
    
    this.rates.set(id, updatedRate);
    return updatedRate;
  }
}

export const storage = new MemStorage();
