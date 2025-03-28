import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updateRateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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
  
  // Update rate (admin only)
  app.post("/api/rates/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
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
        // Update existing rate
        const updatedRate = await storage.updateRate(existingRate.id, {
          current,
          high,
          low,
          category
        });
        
        return res.json(updatedRate);
      } else {
        // Create new rate if it doesn't exist
        const newRate = await storage.createRate({
          type,
          current,
          high,
          low,
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

  const httpServer = createServer(app);
  return httpServer;
}
