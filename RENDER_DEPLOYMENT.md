# Deploying Your Gold & Silver Rate Management App to Render

This guide will walk you through deploying your application to Render and connecting it to a PostgreSQL database.

## Step 1: Create a PostgreSQL Database on Render

1. Log in to your Render account at [render.com](https://render.com)
2. Navigate to **Dashboard** and click the **New +** button
3. Select **PostgreSQL** from the dropdown menu
4. Fill in the database details:
   - **Name**: `rp-jewellers-db` (or your preferred name)
   - **Database**: `jewellers` (optional)
   - **User**: Leave as default or customize
   - **Region**: Choose the region closest to your target users (e.g., Singapore for Indian users)
   - **PostgreSQL Version**: 15 (or latest available)
5. Click **Create Database**

After your database is created, you'll get access to:
- **Internal Database URL**: Use this for connecting from other Render services
- **External Database URL**: Use this for connecting from external applications or locally

## Step 2: Run Database Migrations

Before deploying your web service, you need to run database migrations to create the necessary tables. Here's how to do it:

1. Clone your repository locally: `git clone <your-repo-url>`
2. Install dependencies: `npm install`
3. Create a `.env` file with your Render database URL:
   ```
   DATABASE_URL=postgres://your_username:your_password@your_host/your_db
   ```
4. Run the migrations:
   ```
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

## Step 3: Deploy Your Web Service to Render

1. In your Render dashboard, click **New +** and select **Web Service**
2. Connect your GitHub or GitLab repository
3. Configure your web service:
   - **Name**: `rp-jewellers` (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the same region as your database
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `NODE_ENV=production node server/server.prod.js`
   - **Auto Deploy**: Enable

4. Add the following environment variables:
   - `DATABASE_URL`: Copy the Internal Database URL from your PostgreSQL service
   - `NODE_ENV`: production
   - `SESSION_SECRET`: A random string for session security (generate one with `openssl rand -hex 32`)

5. Click **Create Web Service**

## Step 4: Connect Your Service to Your Database

Render automatically provides secure connections between your web service and database when they're in the same account and region. Your application is already configured to use the `DATABASE_URL` environment variable.

## Step 5: Verify Deployment

1. Wait for your deployment to complete
2. Visit your web service URL (provided by Render)
3. Test your application to ensure everything is working as expected

## Preparing for Production

For a production environment, consider the following:

1. **Custom Domain**: In your web service settings, go to the "Custom Domain" section to add your domain name.
2. **SSL**: Render provides free SSL certificates for all services.
3. **Auto-Scaling**: Configure auto-scaling in your web service settings if needed.
4. **Database Backups**: Render automatically backs up your PostgreSQL database daily. You can also create manual backups.

## Troubleshooting

- **Connection Issues**: Ensure your `DATABASE_URL` environment variable is set correctly.
- **Migration Errors**: Check the database logs in Render for specific error messages.
- **Application Crashes**: Review the web service logs for error details.

## Preparing for Play Store Deployment

To prepare your app for the Google Play Store:

1. **Install Capacitor and Android Dependencies**:
   ```
   npm install @capacitor/android
   npx cap add android
   ```

2. **Configure Capacitor**:
   Update the `capacitor.config.ts` file with your app information:
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.yourcompany.jewellersapp',
     appName: 'RP Jewellers',
     webDir: 'dist',
     server: {
       androidScheme: 'https'
     }
   };

   export default config;
   ```

3. **Build Your Web App**:
   ```
   npm run build
   ```

4. **Sync Your Web App with Capacitor**:
   ```
   npx cap sync
   ```

5. **Open in Android Studio**:
   ```
   npx cap open android
   ```

6. **Build APK in Android Studio**:
   - Go to Build > Generate Signed Bundle/APK
   - Choose APK and follow the steps to create a signing key
   - Choose the release build variant
   - Click 'Create' to generate the APK

7. **Play Store Submission Requirements**:
   - Google Play Developer account (one-time fee of $25)
   - High-quality screenshots in different sizes
   - Privacy policy URL
   - Short and full descriptions of your app
   - App icon in various sizes

8. **Submit Your App**:
   - Log in to [Google Play Console](https://play.google.com/console)
   - Create a new application and follow the prompts to upload your APK and fill in the required information