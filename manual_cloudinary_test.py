import os
import django
from django.conf import settings
import cloudinary
import cloudinary.uploader

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccb_portal_backend.production_settings')
django.setup()

def test_upload():
    print("🚀 Testing Cloudinary Upload...")
    
    # Check credentials
    print(f"Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
    if settings.CLOUDINARY_CLOUD_NAME == 'your-cloud-name':
        print("❌ ERROR: Please update CLOUDINARY_CLOUD_NAME in your environment variables!")
        return

    try:
        # Create a simple text file to upload
        with open('test_upload.txt', 'w') as f:
            f.write('This is a test file for Cloudinary upload.')
            
        print("📤 Uploading test_upload.txt to Cloudinary...")
        
        # Upload to Cloudinary
        response = cloudinary.uploader.upload('test_upload.txt', resource_type='raw')
        
        print("\n✅ Upload Successful!")
        print(f"Public ID: {response.get('public_id')}")
        print(f"URL: {response.get('url')}")
        print(f"Secure URL: {response.get('secure_url')}")
        
        # Clean up local file
        os.remove('test_upload.txt')
        
    except Exception as e:
        print(f"\n❌ Upload Failed: {e}")

if __name__ == '__main__':
    test_upload()
