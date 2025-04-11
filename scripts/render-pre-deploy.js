#!/usr/bin/env node

// This script runs before deployment on Render
// It checks if the database URL is provided and if so, runs the database initialization script

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('Running pre-deployment checks...');

  // Check if we're in production and have a database URL
  if (process.env.NODE_ENV === 'production') {
    if (process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL) {
      console.log('Database URL found, initializing database...');
      
      try {
        // Run the database initialization script
        const { stdout, stderr } = await execAsync('node scripts/init-database.js');
        console.log('Database initialization output:', stdout);
        
        if (stderr) {
          console.error('Database initialization errors:', stderr);
        }
        
        console.log('Database initialization complete!');
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Don't exit with error as the app should still start with in-memory fallback
      }
    } else {
      console.warn('No database URL found. The application will use in-memory storage.');
    }
  } else {
    console.log('Not in production mode, skipping pre-deployment checks');
  }
  
  console.log('Pre-deployment checks complete!');
}

main().catch(error => {
  console.error('Pre-deployment script error:', error);
});