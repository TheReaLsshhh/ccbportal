# 🚨 URGENT: Fix Images Not Displaying on Production

## THE PROBLEM
Images are not showing on your production site (https://ccb-portal-static.onrender.com/) because **the frontend doesn't know where your backend is**.

## THE SOLUTION (5 Minutes)

### ⚡ Quick Fix Steps

#### Step 1: Find Your Backend URL (30 seconds)
1. Go to https://dashboard.render.com/
2. Click on your **backend service** (the Python/Django one, probably named `ccb-portal-backend`)
3. **Copy the URL** at the top of the page (looks like: `https://ccb-portal-backend.onrender.com`)

#### Step 2: Configure Frontend Environment Variable (2 minutes)
1. In Render Dashboard, click on your **frontend static site** (probably named `ccb-portal-frontend` or `ccb-portal-static`)
2. Click the **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Enter:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://ccb-portal-backend.onrender.com` (paste the URL you copied in Step 1)
5. Click **"Save Changes"**

#### Step 3: Redeploy Frontend (2 minutes)
1. Stay on the frontend service page
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait for the deployment to complete (usually 2-3 minutes)

#### Step 4: Verify Backend Configuration (30 seconds)
1. Go back to your **backend service** in Render Dashboard
2. Click **"Environment"** tab
3. Make sure these variables are set:
   
   **ALLOWED_HOSTS** (if not set, add it):
   ```
   ccb-portal-backend.onrender.com,ccb-portal-frontend.onrender.com,ccb-portal-static.onrender.com
   ```
   
   **CORS_ALLOWED_ORIGINS** (if not set, add it):
   ```
   https://ccb-portal-frontend.onrender.com,https://ccb-portal-static.onrender.com
   ```

4. If you changed anything, click "Save Changes" and wait for auto-redeploy

---

## ✅ Verification

After deploying, check if images are now showing:

1. Visit: https://ccb-portal-static.onrender.com/news
2. Open browser DevTools (Press F12)
3. Go to **Console** tab
4. Look for any errors
5. Go to **Network** tab and filter by "Img" - see if images are loading

If images are now showing: **Success! 🎉**

If still not working, see troubleshooting below.

---

## 🔧 Troubleshooting

### Problem: Still no images after following steps

**Solution 1: Check if images exist in backend**
1. Visit your backend admin: `https://your-backend.onrender.com/admin/`
2. Log in
3. Check "Announcements", "Events", "News", and "Achievements"
4. Verify that items have images uploaded
5. If not, upload test images through the admin panel

**Solution 2: Check CORS errors in console**
1. Open browser DevTools (F12)
2. Look in Console for errors mentioning "CORS" or "Access-Control-Allow-Origin"
3. If you see CORS errors:
   - Go to backend service on Render
   - Update `CORS_ALLOWED_ORIGINS` to include your frontend URL
   - Redeploy backend

**Solution 3: Verify API responses**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit your site and look for requests to `/api/announcements/`, `/api/events/`, etc.
4. Click on these requests and check the Response
5. Look for the `image` field - it should contain a full URL like:
   ```json
   "image": "https://ccb-portal-backend.onrender.com/media/announcements/image.jpg"
   ```
6. If the URL is missing or wrong, check backend logs

**Solution 4: Check backend logs**
1. Go to backend service on Render
2. Click "Logs" tab
3. Look for errors when accessing `/media/` files
4. Common issues:
   - File not found (404) - image doesn't exist, upload it via admin
   - Permission denied (403) - check disk mount in render.yaml
   - Server error (500) - check backend logs for details

---

## 📋 What This Fix Does

Your project has two separate services on Render:

1. **Backend (Django)**: Stores and serves images from `/media/` folder
2. **Frontend (React Static Site)**: Displays the website

The frontend code uses an environment variable (`REACT_APP_API_URL`) to know where the backend is located. Without this variable, it can't construct the correct image URLs.

**Before fix:**
```
Frontend tries to load: /media/announcements/image.jpg (wrong - looks on frontend server)
```

**After fix:**
```
Frontend loads: https://ccb-portal-backend.onrender.com/media/announcements/image.jpg (correct!)
```

---

## 📝 Important Notes

1. **Environment variables are set at BUILD TIME** for static sites
   - This means you MUST redeploy the frontend after setting `REACT_APP_API_URL`
   - Just saving the variable is not enough!

2. **Double-check your backend URL**
   - It should NOT include `/api` at the end
   - Correct: `https://ccb-portal-backend.onrender.com`
   - Wrong: `https://ccb-portal-backend.onrender.com/api`

3. **Media files are stored on the backend's disk**
   - Your render.yaml shows a 1GB disk mounted at `/opt/render/project/src/media`
   - This is where uploaded images are stored
   - Make sure you upload images through Django admin, not by manually placing files

4. **First deploy can be slow**
   - Render's free tier can take 2-5 minutes to deploy
   - Be patient and check the deploy logs if it seems stuck

---

## 🆘 Still Not Working?

If images still don't appear after following all steps:

1. **Take a screenshot** of:
   - Your frontend environment variables page on Render
   - Your backend environment variables page on Render
   - Browser console errors (F12 → Console tab)
   - Network tab showing the failed image requests (F12 → Network tab, filter by "Img")

2. **Check these specific URLs** in your browser:
   - Backend API: `https://your-backend.onrender.com/api/announcements/`
   - A specific image: `https://your-backend.onrender.com/media/announcements/[some-image].jpg`
   - (Replace `[some-image].jpg` with an actual filename from the API response)

3. **Verify the URLs match**:
   - The `REACT_APP_API_URL` you set should match your backend URL EXACTLY
   - Check for typos, extra slashes, or `http` vs `https`

---

## 🎓 Understanding the Code

Your project uses these files to handle images:

1. **`src/utils/imageUtils.js`**: Converts relative image URLs to absolute URLs using `REACT_APP_API_URL`
2. **`portal/utils.py`**: Backend function that generates image URLs
3. **`portal/views.py`**: API endpoints that include image URLs in responses
4. **`ccb_portal_backend/production_settings.py`**: Production configuration for media files

All of these are already correctly configured in your code. The ONLY thing missing was the `REACT_APP_API_URL` environment variable on your frontend service.

