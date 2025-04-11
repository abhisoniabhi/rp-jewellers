#!/bin/bash

# Exit on any error
set -e

echo "Running post-deployment tasks..."

# Initialize database in production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Initializing database for production deployment..."
  node scripts/init-database.js
fi

echo "Post-deployment tasks completed successfully!"