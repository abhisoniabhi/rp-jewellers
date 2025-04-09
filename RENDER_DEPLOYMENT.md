# Deploying RP Jewellers App to Render

This guide will walk you through deploying your RP Jewellers Gold & Silver Rate Management application to Render and connecting it to your existing PostgreSQL database.

## Prerequisites

- A Render account (create one at [render.com](https://render.com) if you don't have one already)
- Access to your GitHub repository containing the application code
- Your PostgreSQL database credentials (which you already have)

## Step 1: Database Configuration

You already have a PostgreSQL database set up at Render with the following credentials:
```
DATABASE_URL=postgresql://rpjewellers_user:tdLvdM9l54KcsxulRXR07IMGw2g6skAO@dpg-cvr77e0gjchc73bomseg-a/rpjewellers
```

Verify that your database is accessible:
1. Log in to your Render account
2. Navigate to the **Databases** section
3. Select your PostgreSQL instance
4. Check the **Status** indicator (should be "Available")
5. Note the **Internal Database URL** for later use

## Step 2: Prepare Your Application for Deployment

Your application is already configured to work with the PostgreSQL database through the `DATABASE_URL` environment variable. The key files to know about:

- `server/config.ts`: Loads environment variables
- `server/db.ts`: Handles PostgreSQL connection with fallback
- `drizzle.config.ts`: Configures Drizzle ORM for database migrations
- `shared/schema.ts`: Contains your database schema

## Step 3: Deploy Your Web Service to Render

1. In your Render dashboard, click **New +** and select **Web Service**
2. Connect your GitHub repository
3. Configure your web service:
   - **Name**: `rp-jewellers` 
   - **Environment**: Node
   - **Region**: Choose the same region as your database
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `NODE_ENV=production node server/server.prod.js`

4. Add the following environment variables:
   - `DATABASE_URL`: Copy the **Internal Database URL** from your PostgreSQL service
   - `RENDER_DATABASE_URL`: Use the same URL as DATABASE_URL (needed for initialization script)
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: A random string for session security (generate one with `openssl rand -hex 32`)
   - `DB_SSL`: `true` (enables SSL for secure database connections)
   - `INITIALIZE_SAMPLE_ORDERS`: `false` (set to `true` if you want sample order data)

5. Click **Create Web Service**

## Step 4: Initialize Your Database

The application includes a database initialization script that will create all necessary tables and populate them with default data if they don't exist.

1. SSH into your Render web service (available in the Shell tab)
2. Run the following commands:
   ```
   cd /opt/render/project/src
   # Set production environment
   export NODE_ENV=production 
   # Run the database initialization script
   node scripts/init-database.js
   ```

Alternatively, you can add the database initialization step to your build command:
```
npm install && npm run build && NODE_ENV=production node scripts/init-database.js
```

The initialization script will:
1. Create all required database tables if they don't exist
2. Add a default admin user (username: `admin`, password: `admin123`) if none exists
3. Add default gold and silver rates
4. Add default product collections and sample products
5. Configure default application settings

**Important:** After deployment, log in with the default admin credentials and immediately change the password for security.

## Step 5: Verify Your Deployment

1. Wait for the deployment to complete (check the deployment logs)
2. Visit your web service URL provided by Render
3. Test core functionality:
   - View gold and silver rates
   - Browse collections and products
   - Test admin functionality
   - Ensure real-time updates are working

## Step 6: Set Up Custom Domain (Optional)

For a more professional appearance:

1. In your web service settings, go to **Custom Domain**
2. Add your domain name
3. Follow the DNS configuration instructions provided
4. Render will automatically provision an SSL certificate

## Step 7: Configure Auto-Scaling (Optional)

For production traffic:

1. In your web service settings, go to **Scaling**
2. Configure the number of instances and scaling rules
3. Set up appropriate usage alerts

## Troubleshooting Common Issues

### Database Connection Problems
- Check that the `DATABASE_URL` environment variable matches your Render internal connection string
- Verify that your database service is running
- Check the logs for specific connection errors

### Application Not Starting
- Review the deployment logs for errors
- Ensure your `start` command is correctly configured
- Check for missing environment variables

### Empty or Missing Data
- Run the database initialization script manually: `NODE_ENV=production node scripts/init-database.js`
- Check that the script executed without errors
- Verify database tables and content using the Render PostgreSQL console
- Check environment variables - the script uses `RENDER_DATABASE_URL` in production mode

## Database Backup Strategy

Render automatically backs up your PostgreSQL database daily. To create additional backups:

1. Go to your database service
2. Navigate to the **Backups** tab
3. Click **Manual Backup**
4. Download the backup file for safekeeping

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

## Connect From Local Development

To connect to your Render PostgreSQL database from your local development environment:

1. Use the **External Database URL** from your database dashboard
2. Add it to your local `.env` file
3. Your application will automatically connect to the remote database

Note: For security reasons, Render may restrict database access to specific IP addresses. If you have connection issues, consider adding your IP to the allowed list in your database settings.

## Next Steps: Mobile App Deployment

After your web service is successfully deployed to Render, you can proceed with preparing your Android application for the Google Play Store. See the PLAYSTORE_SUBMISSION.md guide for detailed instructions on building and submitting your Android app.