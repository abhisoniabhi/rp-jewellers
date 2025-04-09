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
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: process.env.PORT || 5000,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    cookieMaxAge: 1000 * 60 * 60 * 24, // 1 day
  }
};