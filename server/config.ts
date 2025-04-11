import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment variables from ${envPath}`);
}

export const config = {
  database: {
    // For Render deployment, use RENDER_DATABASE_URL in production
    url: process.env.NODE_ENV === 'production' 
      ? (process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL || '')
      : (process.env.DATABASE_URL || ''),
    ssl: process.env.DB_SSL === 'true'
  },
  server: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    cookieMaxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production'
  }
};