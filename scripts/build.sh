#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Install dependencies
npm install

# Build the client and server
echo "Building client and server..."
npm run build

# Copy any static assets if needed
echo "Copying static assets..."
if [ -d "server/public" ]; then
  mkdir -p dist/public
  cp -r server/public/* dist/public/
fi

# Run database initialization if in production
if [ "$NODE_ENV" = "production" ]; then
  echo "Initializing database for production..."
  node scripts/init-database.js
fi

echo "Build completed successfully!"