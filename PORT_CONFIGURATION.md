# Dynamic Port Configuration Guide

The Django backend port is now **fully configurable**, allowing you to use any available port for your development server.

## Quick Start

### Default Usage (Port 8000)
```bash
python start_development.py
```

### Custom Port via Command Line
```bash
# Use port 8080
python start_development.py --port 8080

# Short form
python start_development.py -p 8080

# Use port 3001
python start_development.py -p 3001
```

### Custom Port via Environment Variable
```bash
# Windows PowerShell
$env:DJANGO_PORT="8080"
python start_development.py

# Windows CMD
set DJANGO_PORT=8080
python start_development.py

# Linux/Mac
export DJANGO_PORT=8080
python start_development.py
```

## Direct Django Server

You can also run Django directly with a custom port:
```bash
python manage.py runserver 8080
```

**Note**: When using `manage.py runserver` directly, make sure to:
1. Set the `DJANGO_PORT` environment variable if other parts of the app need to know the port
2. Set `REACT_APP_API_BASE` environment variable to match your port for React frontend API calls

## How It Works

1. **Priority Order**:
   - Command-line argument (`--port` or `-p`) has highest priority
   - Environment variable (`DJANGO_PORT`) is second
   - Default port (8000) if nothing is specified

2. **Environment Variables Set Automatically**:
   When you use `start_development.py`, it automatically sets:
   - `DJANGO_PORT` - Used by Django views and backend code
   - `PUBLIC_BASE_URL` - Full backend URL for internal use
   - `REACT_APP_API_BASE` - Used by React frontend for API calls

3. **Admin Panel Access**:
   - Always use the same port as your Django backend
   - Format: `http://localhost:[PORT]/admin/`
   - Example with port 8080: `http://localhost:8080/admin/`

## Examples

### Example 1: Default Port
```bash
python start_development.py
```
Access:
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/

### Example 2: Custom Port 8080
```bash
python start_development.py --port 8080
```
Access:
- Backend: http://localhost:8080
- Admin: http://localhost:8080/admin/

### Example 3: Port Already in Use
If port 8000 is busy, use a different port:
```bash
python start_development.py -p 8081
```

## Important Notes

1. **React Frontend** always runs on port 3000 (not configurable via this script)
2. **Django Backend** port is what you're configuring
3. **Admin Panel** uses the same port as Django backend
4. The startup script will display the correct URLs with your chosen port

## Troubleshooting

### Port Already in Use
If you get an error that the port is already in use:
```bash
# Try a different port
python start_development.py -p 8080
```

### React Can't Connect to Backend
Make sure:
1. You're using `start_development.py` which sets environment variables automatically
2. Or manually set `REACT_APP_API_BASE` environment variable:
   ```bash
   # Windows PowerShell
   $env:REACT_APP_API_BASE="http://localhost:8080"
   npm start
   ```

### Checking Which Port is Running
Look at the startup script output - it will clearly show:
```
📋 Starting servers (Django port: 8080)...
   Django: http://192.168.1.100:8080  (bound 0.0.0.0:8080)
   
🔐 Django Admin Panel:
   http://localhost:8080/admin/
```

## Files Updated for Dynamic Ports

- `start_development.py` - Supports `--port` argument and `DJANGO_PORT` env var
- `portal/views.py` - Reads port from `DJANGO_PORT` environment variable
- Documentation updated to reflect dynamic port configuration

