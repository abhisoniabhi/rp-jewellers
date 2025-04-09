#!/usr/bin/env node

// This script will initialize the PostgreSQL database with necessary tables and data
// It can be run manually or as part of deployment process

import 'dotenv/config';
import pg from 'pg';
import { promisify } from 'util';
import { randomBytes, scrypt } from 'crypto';

const { Client } = pg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const databaseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.RENDER_DATABASE_URL
    : process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: No database URL provided. Set DATABASE_URL in your environment.');
    process.exit(1);
  }
  
  console.log(`Connecting to PostgreSQL database... (${process.env.NODE_ENV} mode)`);
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL database');
    
    // Check if database has the required tables
    console.log('Checking database structure...');
    
    // 1. Check and create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
    
    // 2. Check and create rates table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        current INTEGER NOT NULL,
        high INTEGER NOT NULL,
        low INTEGER NOT NULL,
        icon VARCHAR(50) NOT NULL,
        category VARCHAR(20) NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // 3. Check and create collections table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
    
    // 4. Check and create products table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        price REAL NOT NULL,
        weight REAL NOT NULL DEFAULT 0,
        karat_type VARCHAR(10) NOT NULL DEFAULT '22k',
        category VARCHAR(50) NOT NULL,
        collection_id INTEGER NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0,
        in_stock INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `);
    
    // 5. Check and create settings table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // 6. Check and create orders table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    `);
    
    // 7. Check and create order_items table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    // 8. Check and create notifications table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    // 9. Check and create session table if not exists (for connect-pg-simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    console.log('Database tables created or verified.');
    
    // Check if we need to populate the database with initial data
    const { rows: userCount } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount[0].count) === 0) {
      console.log('No users found, initializing database with default data...');
      
      // 1. Create admin user
      const hashedPassword = await hashPassword('admin123');
      const now = new Date().toISOString();
      await client.query(`
        INSERT INTO users (username, password, is_admin, created_at)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 1, now]);
      console.log('Admin user created');
      
      // 2. Create default rates
      const defaultRates = [
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
        }
      ];
      
      const formattedDate = new Date().toLocaleString("en-IN", {
        day: "numeric", 
        month: "short", 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true
      });
      
      for (const rate of defaultRates) {
        await client.query(`
          INSERT INTO rates (type, current, high, low, icon, category, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [rate.type, rate.current, rate.high, rate.low, rate.icon, rate.category, formattedDate]);
      }
      console.log('Default rates created');
      
      // 3. Create default collections
      const defaultCollections = [
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
        }
      ];
      
      for (const collection of defaultCollections) {
        await client.query(`
          INSERT INTO collections (name, description, image_url, featured, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [collection.name, collection.description, collection.imageUrl, collection.featured, now]);
      }
      console.log('Default collections created');
      
      // 4. Create default products
      // First get the collection IDs
      const { rows: collections } = await client.query('SELECT id, name FROM collections');
      const collectionMap = collections.reduce((map, collection) => {
        map[collection.name] = collection.id;
        return map;
      }, {});
      
      const defaultProducts = [
        {
          name: "Bridal Gold Necklace",
          description: "Exquisite gold necklace with intricate designs for brides",
          imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          price: 150000,
          weight: 45.5,
          category: "necklace",
          collectionName: "Wedding Collection",
          featured: 1
        },
        {
          name: "Wedding Bangles Set",
          description: "Complete set of gold bangles for wedding ceremonies",
          imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          price: 85000,
          weight: 35.8,
          category: "bangles",
          collectionName: "Wedding Collection",
          featured: 1
        },
        {
          name: "Traditional Gold Earrings",
          description: "Classic design inspired by cultural heritage",
          imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          price: 35000,
          weight: 12.5,
          category: "earrings",
          collectionName: "Traditional Gold",
          featured: 0
        },
        {
          name: "Gold Temple Necklace",
          description: "Temple design gold necklace with traditional motifs",
          imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          price: 120000,
          weight: 38.2,
          category: "necklace",
          collectionName: "Traditional Gold",
          featured: 1
        }
      ];
      
      for (const product of defaultProducts) {
        const collectionId = collectionMap[product.collectionName];
        if (collectionId) {
          await client.query(`
            INSERT INTO products (name, description, image_url, price, weight, karat_type, category, collection_id, featured, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [product.name, product.description, product.imageUrl, product.price, product.weight, '22k', product.category, collectionId, product.featured, now]);
        } else {
          console.warn(`Collection '${product.collectionName}' not found for product '${product.name}'`);
        }
      }
      console.log('Default products created');
      
      // 5. Create default settings
      const defaultSettings = [
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
          value: "RP Jewellers",
          description: "Store name"
        }
      ];
      
      for (const setting of defaultSettings) {
        await client.query(`
          INSERT INTO settings (key, value, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [setting.key, setting.value, setting.description, now, now]);
      }
      console.log('Default settings created');
      
      // 6. Create sample orders if needed
      if (process.env.INITIALIZE_SAMPLE_ORDERS === 'true') {
        const orderNumber = "ORD" + Math.floor(100000 + Math.random() * 900000);
        const { rows: orderResult } = await client.query(`
          INSERT INTO orders (order_number, customer_name, customer_phone, status, created_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [orderNumber, 'Sample Customer', '+919876543210', 'completed', now]);
        
        if (orderResult[0] && orderResult[0].id) {
          const { rows: products } = await client.query('SELECT id, price FROM products LIMIT 1');
          if (products.length > 0) {
            await client.query(`
              INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
              VALUES ($1, $2, $3, $4, $5)
            `, [orderResult[0].id, products[0].id, 1, products[0].price, now]);
          }
        }
        console.log('Sample order created');
      }
      
      console.log('Database initialized with default data!');
    } else {
      console.log('Database already has user data, skipping initialization.');
    }
    
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);