import os
import django
from django.conf import settings
import sys

# Mock production environment settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccb_portal_backend.production_settings')

# Ensure we can import project modules
sys.path.append(os.getcwd())

try:
    django.setup()
except Exception as e:
    print(f"❌ Setup Failed: {e}")
    sys.exit(1)

def check_setup():
    print("\n🔍 Checking Production Setup...")
    
    # 1. Check Cloudinary Config
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"\n☁️  Cloudinary Credentials (Environment):")
    print(f"   - CLOUD_NAME: {'✅ Set (' + cloud_name + ')' if cloud_name and cloud_name != 'your-cloud-name' else '❌ MISSING or DEFAULT'}")
    print(f"   - API_KEY:    {'✅ Set' if api_key and api_key != 'your-api-key' else '❌ MISSING or DEFAULT'}")
    print(f"   - API_SECRET: {'✅ Set' if api_secret and api_secret != 'your-api-secret' else '❌ MISSING or DEFAULT'}")

    # Check CLOUDINARY_STORAGE dict
    cloudinary_storage_conf = getattr(settings, 'CLOUDINARY_STORAGE', {})
    print(f"\n⚙️  CLOUDINARY_STORAGE Setting:")
    print(f"   - CLOUD_NAME: {'✅ Set' if cloudinary_storage_conf.get('CLOUD_NAME') else '❌ MISSING'}")
    print(f"   - API_KEY:    {'✅ Set' if cloudinary_storage_conf.get('API_KEY') else '❌ MISSING'}")
    print(f"   - API_SECRET: {'✅ Set' if cloudinary_storage_conf.get('API_SECRET') else '❌ MISSING'}")
    
    # 2. Check Storage Configuration
    print(f"\n💾 Storage Configuration:")
    storages = getattr(settings, 'STORAGES', {})
    default_storage = storages.get('default', {}).get('BACKEND')
    print(f"   - STORAGES['default']: {default_storage}")
    
    if default_storage != 'cloudinary_storage.storage.MediaCloudinaryStorage':
        print("   ❌ ERROR: Default storage is NOT set to Cloudinary!")
    else:
        print("   ✅ Default storage is correctly set to Cloudinary.")

    # 3. Test Storage Instantiation
    print(f"\n🧪 Testing Storage Instantiation...")
    try:
        from django.core.files.storage import DefaultStorage
        storage = DefaultStorage()
        print(f"   ✅ Storage instantiated successfully: {storage}")
    except Exception as e:
        print(f"   ❌ CRITICAL ERROR instantiating storage: {e}")
        print("   -> This is likely causing the 500 error on Render.")
        return

    # 4. Test Cloudinary Connection (only if credentials seem valid)
    if cloud_name and api_key and api_secret and cloud_name != 'your-cloud-name':
        print(f"\n📡 Testing Connection to Cloudinary...")
        try:
            import cloudinary.api
            # Just try to ping or list resources to verify credentials
            print("   Attempting to list resources...")
            response = cloudinary.api.resources(max_results=1)
            print("   ✅ Connection Successful! Cloudinary is reachable.")
        except Exception as e:
            print(f"   ❌ Connection Failed: {e}")
            print("   -> Please verify your Cloudinary credentials in Render Dashboard.")

if __name__ == "__main__":
    check_setup()
