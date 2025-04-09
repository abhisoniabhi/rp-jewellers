import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "jhala-gold-rates-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 86400000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false);
      }
      
      try {
        // For new users, the password is stored directly
        // For existing users with hashed passwords, use comparePasswords
        const isMatch = user.password.includes('.')
          ? await comparePasswords(password, user.password)
          : password === user.password;
        
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // First check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Add additional user metadata if needed
      const timestamp = new Date().toISOString();
      const userData = {
        ...req.body,
        password: hashedPassword,
        role: 'admin', // Default role to admin
        createdAt: timestamp
      };
      
      // Create the user in the database (with fallback to memory storage if DB is unavailable)
      const user = await storage.createUser(userData);
      
      console.log(`User created successfully: ${user.username} (${user.id})`);

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return the user data without sensitive information
        const { password, ...safeUserData } = user;
        res.status(201).json(safeUserData);
      });
    } catch (error) {
      console.error("Error during user registration:", error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // req.user is guaranteed to exist here because passport.authenticate ensures
    // a successful authentication before executing this callback
    if (req.user) {
      console.log(`User logged in successfully: ${req.user.username} (${req.user.id})`);
      
      // TypeScript safe way to destructure
      const user = req.user as Express.User;
      const { password, ...safeUserData } = user;
      res.status(200).json(safeUserData);
    } else {
      // This is a fallback that shouldn't happen due to how passport works
      res.status(500).send("Authentication succeeded but user data is missing");
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return user data without sensitive information
    if (req.user) {
      const user = req.user as Express.User;
      const { password, ...safeUserData } = user;
      res.json(safeUserData);
    } else {
      res.sendStatus(401);
    }
  });
}
