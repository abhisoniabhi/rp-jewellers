import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updateRateSchema, insertCollectionSchema, updateCollectionSchema, insertProductSchema, updateProductSchema, insertSettingSchema, updateSettingSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// OTP store type definitions
interface OtpData {
  otp: string;
  expiresAt: number;
  attempts: number;
  userData: {
    shopName: string;
    userName: string;
    mobileNumber: string;
  };
}

interface OtpStore {
  [key: string]: OtpData;
}

// Extend the global namespace to include our OTP store
declare global {
  var otpStore: OtpStore;
}

// Create WebSocket manager for real-time updates
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    // Use a specific path to avoid conflicts with Vite's HMR WebSocket
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'  // Match the path in the client
    });
    
    this.wss.on("connection", (ws) => {
      console.log("[express] WebSocket client connected");
      this.clients.add(ws);
      
      ws.on("close", () => {
        console.log("[express] WebSocket client disconnected");
        this.clients.delete(ws);
      });
    });
    
    console.log("[express] WebSocket server initialized");
  }

  broadcast(event: string, data: any) {
    if (!this.wss) return;
    
    const message = JSON.stringify({ event, data });
    console.log(`[express] Broadcasting: ${event}`);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Get all rates
  app.get("/api/rates", async (req, res) => {
    try {
      const rates = await storage.getRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rates" });
    }
  });
  
  // Get a specific rate by ID
  app.get("/api/rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rate = await storage.getRateById(id);
      
      if (!rate) {
        return res.status(404).json({ message: "Rate not found" });
      }
      
      res.json(rate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rate" });
    }
  });
  
  // Update rate (temporarily allowing without auth for demo)
  app.post("/api/rates/update", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const result = updateRateSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const { type, current, high, low, category } = result.data;
      
      // Find if rate exists by type
      const existingRate = await storage.getRateByType(type);
      
      if (existingRate) {
        // Update existing rate - we're only updating current rate, high and low will be auto-calculated
        const updatedRate = await storage.updateRate(existingRate.id, {
          current,
          category
        });
        
        // Log update to console for debugging
        console.log(`[express] Updated rate: ${type} from ${existingRate.current} to ${current}`);
        
        // Broadcast the update via WebSockets
        wsManager.broadcast('RATE_UPDATED', updatedRate);
        
        return res.json(updatedRate);
      } else {
        // Create new rate if it doesn't exist
        const newRate = await storage.createRate({
          type,
          current,
          high: current, // Initially set high to current
          low: current,  // Initially set low to current
          category,
          icon: category === "gold" ? "cube" : "coin", // Default icon based on category
        });
        
        return res.status(201).json(newRate);
      }
    } catch (error) {
      console.error("Error updating rate:", error);
      res.status(500).json({ message: "Failed to update rate" });
    }
  });

  // Collection routes
  // Get all collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });
  
  // Get a specific collection by ID
  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollectionById(id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });
  
  // Create a new collection (admin only)
  app.post("/api/collections", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const result = insertCollectionSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const newCollection = await storage.createCollection(result.data);
      return res.status(201).json(newCollection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });
  
  // Update a collection (admin only)
  app.put("/api/collections/:id", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const id = parseInt(req.params.id);
      const result = updateCollectionSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const existingCollection = await storage.getCollectionById(id);
      
      if (!existingCollection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      const updatedCollection = await storage.updateCollection(id, result.data);
      return res.json(updatedCollection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });
  
  // Delete a collection (admin only)
  app.delete("/api/collections/:id", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCollection(id);
      
      if (!success) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Product routes
  // Search for products - This needs to come before other product routes to avoid conflict
  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });
  
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Get a specific product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  // Get products by collection ID
  app.get("/api/collections/:id/products", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getCollectionById(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      const products = await storage.getProductsByCollectionId(collectionId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products for collection" });
    }
  });
  
  // Create a new product (admin only)
  app.post("/api/products", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const result = insertProductSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Verify collection exists
      const collection = await storage.getCollectionById(result.data.collectionId);
      if (!collection) {
        return res.status(400).json({ message: "Collection does not exist" });
      }
      
      const newProduct = await storage.createProduct(result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('PRODUCT_CREATED', newProduct);
      
      return res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  // Update a product (admin only)
  app.put("/api/products/:id", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const id = parseInt(req.params.id);
      const result = updateProductSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // If collection ID is provided, verify it exists
      if (result.data.collectionId) {
        const collection = await storage.getCollectionById(result.data.collectionId);
        if (!collection) {
          return res.status(400).json({ message: "Collection does not exist" });
        }
      }
      
      const existingProduct = await storage.getProductById(id);
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(id, result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('PRODUCT_UPDATED', updatedProduct);
      
      return res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // PATCH endpoint for product update (admin only)
  app.patch("/api/products/:id", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const id = parseInt(req.params.id);
      
      // We'll handle floats for taunch/price specifically
      if (req.body.price !== undefined && typeof req.body.price === 'number') {
        req.body.price = parseFloat(req.body.price.toString());
      }
      if (req.body.taunch !== undefined && typeof req.body.taunch === 'number') {
        req.body.price = parseFloat(req.body.taunch.toString());
        delete req.body.taunch; // Map taunch to price field in DB
      }
      
      const result = updateProductSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Validation error:", result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // If collection ID is provided, verify it exists
      if (result.data.collectionId) {
        const collection = await storage.getCollectionById(result.data.collectionId);
        if (!collection) {
          return res.status(400).json({ message: "Collection does not exist" });
        }
      }
      
      const existingProduct = await storage.getProductById(id);
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(id, result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('PRODUCT_UPDATED', updatedProduct);
      
      return res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // Delete a product (admin only)
  app.delete("/api/products/:id", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('PRODUCT_DELETED', { id });
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Settings routes
  // Get all settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Get setting by key
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  
  // Create a new setting (admin only)
  app.post("/api/settings", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const result = insertSettingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Check if setting with key already exists
      const existingSetting = await storage.getSettingByKey(result.data.key);
      if (existingSetting) {
        return res.status(400).json({ message: "Setting with this key already exists" });
      }
      
      const newSetting = await storage.createSetting(result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('SETTING_CREATED', newSetting);
      
      return res.status(201).json(newSetting);
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });
  
  // Update a setting (admin only)
  app.put("/api/settings/:key", async (req, res) => {
    // Authentication check temporarily disabled for demo purposes
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ message: "Not authenticated" });
    // }
    
    try {
      const key = req.params.key;
      const result = updateSettingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Check if setting exists
      const existingSetting = await storage.getSettingByKey(key);
      if (!existingSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      const updatedSetting = await storage.updateSetting(key, result.data.value);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('SETTING_UPDATED', updatedSetting);
      
      return res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Order routes
  // Create a new order
  app.post("/api/orders", async (req, res) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const newOrder = await storage.createOrder(result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('ORDER_CREATED', newOrder);
      
      return res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Get a specific order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  // Get a specific order by order number
  app.get("/api/orders/number/:orderNumber", async (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      const order = await storage.getOrderByNumber(orderNumber);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('ORDER_UPDATED', updatedOrder);
      
      return res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  // Add item to order
  app.post("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Check if order exists
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Add orderId to the request body
      req.body.orderId = orderId;
      
      const result = insertOrderItemSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Check if product exists
      const product = await storage.getProductById(result.data.productId);
      if (!product) {
        return res.status(400).json({ message: "Product does not exist" });
      }
      
      const newOrderItem = await storage.addOrderItem(result.data);
      
      // Broadcast the update via WebSockets
      wsManager.broadcast('ORDER_ITEM_ADDED', newOrderItem);
      
      return res.status(201).json(newOrderItem);
    } catch (error) {
      console.error("Error adding order item:", error);
      res.status(500).json({ message: "Failed to add order item" });
    }
  });
  
  // Get order items for a specific order
  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Check if order exists
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });
  
  // OTP verification routes
  // Send OTP
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { mobileNumber, shopName, userName } = req.body;
      
      if (!mobileNumber || !shopName || !userName) {
        return res.status(400).json({ 
          message: "Mobile number, shop name, and user name are required" 
        });
      }
      
      if (!/^\d{10}$/.test(mobileNumber)) {
        return res.status(400).json({ 
          message: "Please provide a valid 10-digit mobile number" 
        });
      }
      
      // In a real-world application, we would:
      // 1. Generate a random OTP (4-6 digits)
      // 2. Store it in the database with the mobile number and expiration time
      // 3. Send it via an SMS gateway service
      
      // For this demo, we'll simulate sending an OTP
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`[OTP] Generated OTP for ${mobileNumber}: ${generatedOtp}`);
      
      // Store OTP in memory for verification (in production, this would be in a database)
      // This is a simple implementation - in production, use a proper data store
      if (!global.otpStore) global.otpStore = {};
      global.otpStore[mobileNumber] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
        attempts: 0,
        userData: { shopName, userName, mobileNumber }
      };
      
      // In a real app, we would send an SMS here
      // For demo purposes, we're just returning success
      return res.status(200).json({ 
        message: "OTP sent successfully",
        // ONLY FOR DEMO - in production, never send the OTP back in response
        otp: generatedOtp  
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
  
  // Verify OTP
  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { mobileNumber, otp } = req.body;
      
      if (!mobileNumber || !otp) {
        return res.status(400).json({ 
          message: "Mobile number and OTP are required" 
        });
      }
      
      // Check if OTP exists and is valid
      if (!global.otpStore || !global.otpStore[mobileNumber]) {
        return res.status(400).json({ 
          message: "No OTP request found for this mobile number" 
        });
      }
      
      const otpData = global.otpStore[mobileNumber];
      
      // Check if OTP is expired
      if (Date.now() > otpData.expiresAt) {
        // Clean up expired OTP
        delete global.otpStore[mobileNumber];
        return res.status(400).json({ 
          message: "OTP has expired. Please request a new one" 
        });
      }
      
      // Increment attempts
      otpData.attempts += 1;
      
      // Check max attempts (3)
      if (otpData.attempts > 3) {
        delete global.otpStore[mobileNumber];
        return res.status(400).json({ 
          message: "Too many failed attempts. Please request a new OTP" 
        });
      }
      
      // Check if OTP matches
      if (otpData.otp !== otp) {
        return res.status(400).json({ 
          message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining` 
        });
      }
      
      // OTP is valid - clean up and return success
      const userData = otpData.userData;
      delete global.otpStore[mobileNumber];
      
      // In a real app, you might create a user here or sign them in
      
      return res.status(200).json({ 
        message: "OTP verified successfully",
        user: userData
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server with the HTTP server
  wsManager.initialize(httpServer);
  
  return httpServer;
}
