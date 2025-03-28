import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import createMemoryStore from 'memorystore';

console.log("Starting test-auth.js server setup...");

const MemoryStore = createMemoryStore(session);
const app = express();

// Setup basic session
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
app.use(session({
  secret: 'test-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 86400000, // 24 hours
  }
}));

// Basic auth routes
app.post('/api/login', (req, res) => {
  // Simple login that accepts any username/password
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  
  // Set user in session
  req.session.user = {
    id: 1,
    username: req.body.username,
    isAdmin: 1
  };
  
  res.json(req.session.user);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.session.user);
});

// Home route
app.get('/', (req, res) => {
  res.send('Auth test server is running');
});

// Create HTTP server
const server = createServer(app);

// Listen on port 5000
const port = 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Test Auth server running on port ${port}`);
});