# 🔍 Troubleshoot: Image File Missing on Disk

## Problem
Backend shows "HAS IMAGE: Yes" but image won't display. This usually means:
- ✅ Database has the file path
- ❌ File doesn't actually exist on disk

## Quick Tests (Do These Now)

### Test 1: Try to View Image in Django Admin
1. Go to: https://ccb-portal-backend.onrender.com/admin/portal/news/
2. Click on the news item "wdada" to EDIT it
3. Look at the "Image" field
4. **Click on the image filename** (it should be a link)
5. What happens?
   - ✅ **Image displays**: File exists! Issue is elsewhere
   - ❌ **404 or error**: File doesn't exist on disk!

### Test 2: Test Direct URL
Open this URL directly in a new browser tab:
```
https://ccb-portal-backend.onrender.com/media/news/5a48ae8e-c347-49cc-bd27-5454f3be4731_QZwpiMd.jpg
```

What do you see?
- ✅ **Image displays**: File exists and is accessible!
- ❌ **404 Not Found**: File doesn't exist on backend disk
- ❌ **403 Forbidden**: Permission issue
- ❌ **500 Error**: Backend error (check logs)

### Test 3: Check Network Tab
1. Open your site: https://ccb-portal-static.onrender.com/news
2. Open DevTools (F12)
3. Go to **Network** tab
4. Reload page (F5)
5. Filter by "media" or find the image request
6. Click on the failed image request
7. Check the **Status Code**:
   - **404**: File doesn't exist
   - **403**: Permission denied
   - **500**: Server error
   - **200**: File exists but might be CORS issue

## Solution: Re-upload the Image

If file doesn't exist (404 error), you need to re-upload:

### Option 1: Delete and Re-create (Recommended)
1. Go to Django admin: https://ccb-portal-backend.onrender.com/admin/portal/news/
2. Select the "wdada" news item
3. Click **"Delete"** button at bottom
4. Confirm deletion
5. Click **"ADD NEWS +"** button
6. Fill in all fields
7. **Upload the image again**
8. Click **"Save"**
9. Test on frontend

### Option 2: Edit and Re-upload Image
1. Go to Django admin: https://ccb-portal-backend.onrender.com/admin/portal/news/
2. Click on "wdada" to edit
3. Scroll to **"Image"** field
4. Click **"Choose File"** button
5. Select the same image file (or a new one)
6. Click **"Save"**
7. Test on frontend

## Why Files Go Missing

On Render free tier, files can be lost if:
- Service was redeployed without persistent disk
- Disk wasn't mounted correctly
- File was uploaded before disk was configured
- Service was deleted and recreated

## Prevention

### Ensure Disk is Configured
Check render.yaml has:
```yaml
disk:
  name: media-disk
  mountPath: /opt/render/project/src/media
  sizeGB: 1
```

### Verify Disk is Mounted
1. Go to Render Dashboard
2. Backend service → Settings
3. Check "Persistent Disk" section
4. Should show: "media-disk" mounted at correct path

## Verify After Re-upload

After re-uploading:
1. Test direct URL (should show image)
2. Check Network tab (should be 200 OK)
3. Verify on frontend (should display)
