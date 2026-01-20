# Render Deployment - Image Display Fix

## Problem
Images are not displaying on the production site (https://ccb-portal-static.onrender.com/) because the frontend doesn't know the backend URL where images are served from.

## Solution

### Step 1: Configure Frontend Environment Variable on Render

1. **Go to your Render Dashboard**: https://dashboard.render.com/
2. **Select your static site**: `ccb-portal-frontend`
3. **Go to Environment tab**
4. **Add the environment variable** (or update if it exists):
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://ccb-portal-backend.onrender.com` (replace with your actual backend URL)

   > **Important**: Replace `ccb-portal-backend` with your actual backend service name on Render.
   > 
   > To find your backend URL:
   > - Go to Render Dashboard
   > - Click on your backend service (the Python/Django one)
   > - Copy the URL shown at the top (e.g., `https://ccb-portal-backend.onrender.com`)

5. **Save Changes**
6. **Trigger a Manual Deploy** of the frontend static site:
   - Click "Manual Deploy" → "Deploy latest commit"
   - This rebuilds the frontend with the new environment variable

### Step 2: Verify Backend Configuration

Make sure your backend service has these environment variables set:

1. **ALLOWED_HOSTS**:
   ```
   ccb-portal-backend.onrender.com,ccb-portal-frontend.onrender.com,ccb-portal-static.onrender.com
   ```

2. **CORS_ALLOWED_ORIGINS**:
   ```
   https://ccb-portal-frontend.onrender.com,https://ccb-portal-static.onrender.com
   ```

### Step 3: Verify Backend URL Format

Your backend should respond with proper CORS headers and serve media files from the `/media/` path.

Test your backend by visiting:
```
https://your-backend-url.onrender.com/api/announcements/
https://your-backend-url.onrender.com/api/events/
https://your-backend-url.onrender.com/api/news/
https://your-backend-url.onrender.com/api/achievements/
```

The image URLs in the response should be absolute URLs like:
```json
{
  "image": "https://ccb-portal-backend.onrender.com/media/announcements/image.jpg"
}
```

## How It Works

1. **Frontend** (static site) uses `REACT_APP_API_URL` to know where the backend is
2. **API calls** are made to `${REACT_APP_API_URL}/api/...`
3. **Image URLs** are constructed using `REACT_APP_API_URL` + the relative image path
4. The frontend's `normalizeImageUrl()` function in `src/utils/imageUtils.js` handles this conversion

## Quick Verification Checklist

- [ ] Backend URL is accessible (try opening it in browser)
- [ ] `REACT_APP_API_URL` is set on frontend static site
- [ ] `ALLOWED_HOSTS` includes both frontend and backend domains on backend service
- [ ] `CORS_ALLOWED_ORIGINS` includes the frontend domain on backend service
- [ ] Frontend has been redeployed after setting `REACT_APP_API_URL`
- [ ] Images exist in the backend's media folder (check via Django admin)
- [ ] Backend's disk is properly mounted at `/opt/render/project/src/media` (check render.yaml)

## Alternative: Check Current Configuration

To verify your current environment variables:

### On Render:
1. Go to your service
2. Click "Environment" tab
3. Check all variables are correctly set

### Local Testing:
Create a `.env` file in your project root:
```env
REACT_APP_API_URL=http://127.0.0.1:8000
```

Then run:
```bash
npm start
```

Images should load locally to confirm the code is working correctly.

## Troubleshooting

### Images still not loading?

1. **Check browser console** for errors:
   - Open DevTools (F12)
   - Check Console and Network tabs
   - Look for failed image requests
   - Note the URLs being requested

2. **Verify API responses**:
   - Open Network tab in DevTools
   - Look at the response from `/api/announcements/`, `/api/events/`, etc.
   - Check if `image` field has a proper URL

3. **Check CORS errors**:
   - If you see CORS errors in console, the backend needs to allow the frontend domain
   - Update `CORS_ALLOWED_ORIGINS` on the backend

4. **Verify media files exist**:
   - Log into your Django admin: `https://your-backend.onrender.com/admin/`
   - Check if announcements, events, news, and achievements have images uploaded
   - Try uploading a test image through the admin panel

5. **Check backend logs**:
   - Go to your backend service on Render
   - Click "Logs" tab
   - Look for any errors when media files are requested

## Need More Help?

If images still don't load after these steps, check:
1. The exact backend URL you're using
2. The response from the API endpoints
3. Any console errors in the browser
4. The backend logs on Render

