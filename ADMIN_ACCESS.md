# Django Admin Access Guide

## Quick Access URLs

**Django Admin Panel** (Backend Management):
- **Primary URL**: http://localhost:8000/admin/ (default port)
- **Alternative**: http://127.0.0.1:8000/admin/
- **With Custom Port**: http://localhost:[PORT]/admin/ (replace [PORT] with your chosen port)

## Dynamic Port Configuration

The Django backend port is now **configurable**! You can use any port you want:

### Method 1: Command Line Argument
```bash
python start_development.py --port 8080
# or short form:
python start_development.py -p 8080
```

### Method 2: Environment Variable
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

### Method 3: Direct Django Runserver
```bash
python manage.py runserver 8080
```

**Note**: If no port is specified, it defaults to **8000**.

## Important Notes

1. **Use Django Backend Port** - The Django admin runs on the **Django backend server** (default: port 8000), NOT the React frontend (port 3000)

2. **Trailing Slash** - Always include the trailing slash: `/admin/` not `/admin`

3. **Server Must Be Running** - Make sure the Django server is running:
   ```bash
   python manage.py runserver
   ```
   Or use the startup script:
   ```bash
   python start_development.py
   # Or with custom port:
   python start_development.py --port 8080
   ```

## Creating a Superuser

If you don't have admin credentials yet, create a superuser:

```bash
python manage.py createsuperuser
```

You'll be prompted for:
- Username
- Email (optional)
- Password (enter twice)

## Troubleshooting

### Getting 404 Error?

1. **Check the URL**: Make sure you're using `http://localhost:[PORT]/admin/` (with trailing slash and correct port)
2. **Check the Port**: Use the Django backend port (default: **8000**), not 3000 (React frontend)
3. **Check Server Status**: Make sure Django is running - you should see output in your terminal showing the port
4. **Check Browser**: Try both `localhost` and `127.0.0.1`
5. **Verify Port**: Check the startup messages to confirm which port Django is using

### Server Not Starting?

1. Make sure you're in the project root directory
2. Check if your chosen port is already in use (try a different port with `--port` argument)
3. Verify Python and Django are installed correctly

## What You Can Manage

Once logged in, you can manage:
- Academic Programs
- Program Specializations
- Announcements
- Events
- Achievements
- Departments
- Personnel

## React Admin vs Django Admin

- **React Admin** (`http://localhost:3000/admin`) - Frontend admin interface for content management
- **Django Admin** (`http://localhost:[PORT]/admin/`) - Backend database administration panel (default port: 8000)

You need to access the **Django Admin** at the Django backend port (default: 8000) for backend administration. The port number will be shown in the startup script output.

