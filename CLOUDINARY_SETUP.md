# ☁️ Cloudinary Setup Guide

## ✅ What Was Done

Cloudinary has been integrated into your Django project to provide **persistent image storage** on Render's free tier.

### Changes Made:
1. ✅ Added `django-cloudinary-storage` and `cloudinary` to `requirements.txt`
2. ✅ Updated `production_settings.py` to use Cloudinary for media files
3. ✅ Added Cloudinary to `INSTALLED_APPS`
4. ✅ Configured Cloudinary with your credentials

## 🔧 Environment Variables on Render

You need to add these environment variables to your **backend service** on Render:

### Step 1: Go to Render Dashboard
1. Go to: https://dashboard.render.com/
2. Click on your **backend service** (`ccb-portal-backend`)

### Step 2: Add Environment Variables
1. Click **"Environment"** tab
2. Click **"Add Environment Variable"** for each:

   **Variable 1:**
   - **Key**: `CLOUDINARY_CLOUD_NAME`
   - **Value**: `dvodewe6g`

   **Variable 2:**
   - **Key**: `CLOUDINARY_API_KEY`
   - **Value**: `618824283564593`

   **Variable 3:**
   - **Key**: `CLOUDINARY_API_SECRET`
   - **Value**: `cJGnBgAJGxxDU2bR9-UYx9sGiPA`

3. Click **"Save Changes"** after adding each variable

### Step 3: Backend Will Auto-Redeploy
- Render will automatically redeploy your backend after saving environment variables
- Wait 2-4 minutes for deployment to complete

## 🚀 After Deployment

### Step 1: Verify Backend is Running
1. Check Render logs to ensure deployment succeeded
2. Visit: https://ccb-portal-backend.onrender.com/admin/
3. Should be able to log in

### Step 2: Re-upload Images
1. Go to Django admin: https://ccb-portal-backend.onrender.com/admin/
2. Navigate to:
   - **News** → Edit items → Re-upload images
   - **Events** → Edit items → Re-upload images
   - **Announcements** → Edit items → Re-upload images
   - **Achievements** → Edit items → Re-upload images
3. After uploading, images will be stored on Cloudinary
4. Images will persist even after service restarts! ✅

### Step 3: Test Frontend
1. Go to: https://ccb-portal-static.onrender.com/news
2. Hard refresh: Ctrl+Shift+R
3. Images should now display! 🎉

## 📋 How It Works

### Before (Files Lost):
```
Upload image → Saved to /media/ → Service restarts → File deleted ❌
```

### After (Files Persist):
```
Upload image → Saved to Cloudinary → Service restarts → File still exists ✅
```

### Image URLs:
- **Before**: `https://backend.onrender.com/media/news/image.jpg` (lost on restart)
- **After**: `https://res.cloudinary.com/dvodewe6g/image/upload/news/image.jpg` (persistent!)

## 🎯 Benefits

1. ✅ **Persistent Storage**: Images survive service restarts
2. ✅ **CDN Delivery**: Cloudinary serves images via fast CDN
3. ✅ **Free Tier**: 25GB storage + 25GB bandwidth/month
4. ✅ **Automatic Optimization**: Cloudinary can optimize images
5. ✅ **Works on Free Tier**: No need to upgrade Render

## 🔍 Verify It's Working

After uploading an image in Django admin:
1. Check the image URL in the admin (should start with `https://res.cloudinary.com/`)
2. Click the image link - should display from Cloudinary
3. Check frontend - image should display correctly

## 🆘 Troubleshooting

### Images Still Not Displaying?
1. **Check environment variables** are set correctly on Render
2. **Verify backend redeployed** after adding variables
3. **Re-upload images** after Cloudinary is configured
4. **Check Cloudinary dashboard** - images should appear there

### Cloudinary Dashboard
- Visit: https://cloudinary.com/console
- Go to "Media Library"
- You should see uploaded images there

### Error: "Cloudinary not configured"
- Check environment variables are set
- Verify variable names are exact (case-sensitive)
- Redeploy backend

## 📝 Notes

- **Old images**: Images uploaded before Cloudinary setup won't work (they were on disk that got wiped)
- **New images**: All images uploaded after Cloudinary setup will persist
- **Migration**: You'll need to re-upload existing images through Django admin
- **Storage**: Images are now stored on Cloudinary, not on Render's disk

---

**Your images will now persist forever!** 🎉
