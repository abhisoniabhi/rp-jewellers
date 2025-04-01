import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updateRateSchema, insertCollectionSchema, updateCollectionSchema, insertProductSchema, updateProductSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Search for products
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

  const httpServer = createServer(app);
  
  // Initialize WebSocket server with the HTTP server
  wsManager.initialize(httpServer);
  
  return httpServer;
}
