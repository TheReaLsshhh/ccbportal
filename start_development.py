#!/usr/bin/env python
"""
Development startup script for CCB Portal
Starts both Django backend and React frontend
"""

import subprocess
import sys
import os
import time
import threading
import socket
import argparse
from pathlib import Path


def get_lan_ip() -> str:
    """Best-effort to determine the host's LAN IPv4 address.
    Falls back to 127.0.0.1 if detection fails.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Doesn't need to be reachable; used to pick a route/interface
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def start_django(bind_ip: str, port: int):
    """Start Django development server bound to provided IP and port."""
    print(f"🚀 Starting Django backend server on port {port}...")
    try:
        subprocess.run([sys.executable, "manage.py", "runserver", f"{bind_ip}:{port}"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Django server stopped")
    except Exception as e:
        print(f"❌ Error starting Django: {e}")

def start_react():
    """Start React development server"""
    print("⚛️  Starting React frontend server...")
    try:
        # Use shell=True for Windows compatibility
        subprocess.run("npm start", shell=True, check=True, env=os.environ.copy())
    except KeyboardInterrupt:
        print("\n🛑 React server stopped")
    except Exception as e:
        print(f"❌ Error starting React: {e}")

def main():
    # Parse command-line arguments for port
    parser = argparse.ArgumentParser(description='Start CCB Portal Development Environment')
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=int(os.getenv('DJANGO_PORT', '8000')),
        help='Port for Django backend server (default: 8000 or DJANGO_PORT env var)'
    )
    args = parser.parse_args()
    
    port = args.port
    
    print("🎯 CCB Portal Development Environment")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path("manage.py").exists():
        print("❌ Error: manage.py not found. Please run this script from the project root.")
        return
    
    if not Path("package.json").exists():
        print("❌ Error: package.json not found. Please run this script from the project root.")
        return
    
    lan_ip = get_lan_ip()
    
    # Set environment variables with dynamic port
    os.environ['DJANGO_PORT'] = str(port)
    os.environ.setdefault("PUBLIC_BASE_URL", f"http://{lan_ip}:{port}")
    os.environ.setdefault("REACT_APP_API_BASE", f"http://{lan_ip}:{port}")

    print("✅ Project structure verified")
    print(f"\n📋 Starting servers (Django port: {port})...")
    print(f"   Django: http://{lan_ip}:{port}  (bound 0.0.0.0:{port})")
    print("   React:  http://localhost:3000")
    print(f"   Verify link base (PUBLIC_BASE_URL): {os.environ['PUBLIC_BASE_URL']}")
    print("\n🔐 Django Admin Panel:")
    print(f"   http://localhost:{port}/admin/")
    print(f"   http://127.0.0.1:{port}/admin/")
    print(f"   ⚠️  IMPORTANT: Use port {port} (Django), NOT port 3000 (React)")
    print(f"\nNote: If accessing from phone/tablet, ensure your device is on the same Wi‑Fi ")
    print(f"      and Windows Firewall allows Python on port {port} (Private network).")
    print("\nPress Ctrl+C to stop all servers")
    print("-" * 40)
    
    # Start Django in a separate thread, bound to all interfaces
    django_thread = threading.Thread(target=start_django, args=("0.0.0.0", port), daemon=True)
    django_thread.start()
    
    # Give Django a moment to start
    time.sleep(2)
    
    # Start React in main thread
    start_react()

if __name__ == "__main__":
    main() 