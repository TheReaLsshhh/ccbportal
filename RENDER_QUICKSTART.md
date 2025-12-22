# Render.com Quick Start Guide

> **Note**: This guide is configured for **Free Tier** accounts. The `render.yaml` uses `plan: free` for both database and web service.

## 🚀 Fast Deployment (5 Minutes)

### Step 1: Prepare Your Code

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Blueprint"**
3. **Connect your Git repository**
4. **Render will detect `render.yaml` automatically**
   - ✅ Both services are configured for **Free Tier** (`plan: free`)
   - ✅ No payment required - perfect for testing and development
5. **Click "Apply"**

### Step 3: Configure Environment Variables

After services are created, go to **ccb-portal-backend** service → **Environment**:

1. **Set `ALLOWED_HOSTS`**: 
   - Value: `your-service-name.onrender.com` (check your service URL)
   
2. **Set `CORS_ALLOWED_ORIGINS`**: 
   - Value: `https://your-service-name.onrender.com` (same as above)

3. **Optional - Set `BREVO_API_KEY`**:
   - Only if you're using email features

### Step 4: Create Admin User

**Option 1: Using Environment Variables (Recommended for Free Tier)**

1. Go to **ccb-portal-backend** → **Environment**
2. Add these environment variables:
   - `DJANGO_SUPERUSER_USERNAME`: Your desired admin username (e.g., `admin`)
   - `DJANGO_SUPERUSER_EMAIL`: Admin email (e.g., `admin@example.com`)
   - `DJANGO_SUPERUSER_PASSWORD`: Your desired admin password
3. **Redeploy** the service (or it will auto-create on next deploy)
4. The superuser will be created automatically on startup

**Option 2: Using Shell (if available)**

1. Go to **ccb-portal-backend** → **Shell**
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Follow prompts to create admin account

**Option 3: Using Management Command**

If you can access the shell, you can also run:
```bash
python manage.py create_superuser_if_none --username admin --email admin@example.com --password yourpassword
```

### Step 5: Access Your App

- **Frontend**: `https://your-service-name.onrender.com`
- **Admin**: `https://your-service-name.onrender.com/admin`

## ✅ That's It!

Your app should now be live. Check the logs if you encounter any issues.

## ⚠️ Free Tier Limitations

Since you're using the **Free Tier**, be aware of these limitations:

1. **Service Spin-Down**: Your web service will spin down after **15 minutes of inactivity**
   - First request after spin-down may take 30-60 seconds to wake up
   - This is normal for free tier services

2. **Database**: 
   - Free PostgreSQL databases have **90-day data retention**
   - 1GB storage limit
   - Perfect for development and testing

3. **Build Time**: Limited build minutes per month (usually sufficient for regular deployments)

4. **No Custom Domain**: Free tier services use `.onrender.com` subdomains

**To avoid spin-down** (if needed), consider upgrading to a Starter plan ($7/month) for always-on services.

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `requirements.txt` has all dependencies
- Verify Node.js version compatibility

### Database Errors
- Verify `DATABASE_URL` is set (auto-set by Render)
- Check PostgreSQL service is running
- Run migrations manually: `python manage.py migrate`

### 500 Errors
- Check application logs
- Verify `ALLOWED_HOSTS` matches your domain
- Ensure all environment variables are set

### Service Spun Down (Free Tier)
- **First request after inactivity**: May take 30-60 seconds to wake up
- **This is normal**: Free tier services spin down after 15 minutes of inactivity
- **Solution**: Wait for the service to wake up, or upgrade to Starter plan for always-on

## 📚 Full Documentation

See `RENDER_DEPLOYMENT.md` for detailed information.

