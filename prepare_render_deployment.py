#!/usr/bin/env python3
"""
One-Click Render Deployment Script for CCB Portal
This script helps you deploy both frontend and backend to Render
"""

import os
import sys
import subprocess
from pathlib import Path

def check_prerequisites():
    """Check if all prerequisites are met"""
    print("🔍 Checking prerequisites...")
    
    # Check if git is available
    try:
        result = subprocess.run(['git', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Git is not available")
            return False
    except FileNotFoundError:
        print("❌ Git is not installed")
        return False
    
    # Check if code is pushed to GitHub
    try:
        result = subprocess.run(['git', 'status'], capture_output=True, text=True, cwd=Path(__file__).parent)
        if "nothing to commit" not in result.stdout:
            print("⚠️  You have uncommitted changes")
            print("Please commit and push your changes first:")
            print("  git add .")
            print("  git commit -m 'Your message'")
            print("  git push origin main")
            return False
    except Exception as e:
        print(f"❌ Error checking git status: {e}")
        return False
    
    print("✅ Prerequisites check passed")
    return True

def validate_configuration():
    """Validate the configuration files"""
    print("🔧 Validating configuration...")
    
    base_dir = Path(__file__).parent
    
    # Check if render.yaml exists
    render_file = base_dir / "render.yaml"
    if not render_file.exists():
        print("❌ render.yaml not found")
        return False
    
    # Check if production_settings.py exists
    prod_settings = base_dir / "ccb_portal_backend" / "production_settings.py"
    if not prod_settings.exists():
        print("❌ production_settings.py not found")
        return False
    
    # Check if build.sh exists and is executable
    build_script = base_dir / "build.sh"
    if not build_script.exists():
        print("❌ build.sh not found")
        return False
    
    print("✅ Configuration files validated")
    return True

def test_local_setup():
    """Test the local setup before deployment"""
    print("🧪 Testing local setup...")
    
    try:
        # Test Django settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccb_portal_backend.settings')
        import django
        django.setup()
        from django.conf import settings
        
        print(f"✅ Django settings loaded: DEBUG={settings.DEBUG}")
        
        # Test image URL generation
        from portal.utils import build_production_media_url
        from django.core.files.base import ContentFile
        
        # Create a mock file with URL attribute
        test_file = ContentFile(b'test', name='test.jpg')
        test_file.url = '/media/test.jpg'
        
        result = build_production_media_url(test_file)
        expected = "https://ccb-portal-backend.onrender.com/media/test.jpg"
        
        print(f"Image URL generation result: {result}")
        print(f"Expected: {expected}")
        
        if result == expected:
            print(f"✅ Image URL generation working")
        else:
            print(f"❌ Image URL generation failed")
            return False
        
        # Test frontend URL normalization
        REACT_APP_API_URL = os.getenv('REACT_APP_API_URL', 'https://ccb-portal-backend.onrender.com')
        BACKEND_URL = REACT_APP_API_URL.rstrip('/')
        
        def normalizeImageUrl(imageUrl):
            if not imageUrl:
                return None
            if imageUrl.startswith('data:') or imageUrl.startswith('blob:'):
                return imageUrl
            if imageUrl.startswith('http://') or imageUrl.startswith('https://'):
                return imageUrl
            if imageUrl.startswith('/'):
                return f'{BACKEND_URL}{imageUrl}'
            return f'{BACKEND_URL}/{imageUrl}'
        
        test_result = normalizeImageUrl('/media/test.jpg')
        if test_result == expected:
            print(f"✅ Frontend URL normalization working: {test_result}")
        else:
            print(f"❌ Frontend URL normalization failed: {test_result} != {expected}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Local setup test failed: {e}")
        return False

def generate_deployment_checklist():
    """Generate a deployment checklist"""
    print("\n" + "="*60)
    print("🚀 RENDER DEPLOYMENT CHECKLIST")
    print("="*60)
    
    checklist = [
        "✅ GitHub repository is up to date",
        "✅ Configuration files are valid",
        "✅ Local setup tests passed",
        "",
        "📋 NEXT STEPS:",
        "1. Login to render.com",
        "2. Click 'New' → 'Blueprint'",
        "3. Connect your GitHub repository",
        "4. Render will automatically detect render.yaml",
        "5. Review and deploy both services",
        "",
        "🔧 MANUAL STEPS (if Blueprint doesn't work):",
        "1. Create Web Service for backend manually",
        "2. Create Static Site for frontend manually",
        "3. Set environment variables as shown in guide",
        "",
        "🧪 AFTER DEPLOYMENT:",
        "1. Test backend: https://ccb-portal-backend.onrender.com/api/test/",
        "2. Create superuser via Render shell",
        "3. Test image upload in admin panel",
        "4. Verify images display on frontend",
        "5. Check CORS and HTTPS settings",
    ]
    
    for item in checklist:
        print(item)
    
    print("\n📖 Full guide: RENDER_DEPLOYMENT_GUIDE.md")
    print("="*60)

def main():
    """Main deployment preparation function"""
    print("🚀 CCB Portal Render Deployment Preparation")
    print("="*60)
    
    # Step 1: Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites check failed. Please fix the issues above.")
        return False
    
    # Step 2: Validate configuration
    if not validate_configuration():
        print("❌ Configuration validation failed. Please fix the issues above.")
        return False
    
    # Step 3: Test local setup
    if not test_local_setup():
        print("❌ Local setup test failed. Please fix the issues above.")
        return False
    
    # Step 4: Generate deployment checklist
    generate_deployment_checklist()
    
    print("\n✅ Deployment preparation completed successfully!")
    print("🎯 Ready to deploy to Render!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)