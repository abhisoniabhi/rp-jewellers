import express from 'express';
import { createServer } from 'http';

console.log("Starting test-esm.js server setup...");

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World from ESM server!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint is working' });
});

// Create HTTP server
const server = createServer(app);

// Listen on port 5000
const port = 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Test ESM server running on port ${port}`);
});