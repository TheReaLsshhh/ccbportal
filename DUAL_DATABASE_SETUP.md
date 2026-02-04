# Dual Database Support (PostgreSQL + XAMPP MySQL)

This application now supports both PostgreSQL and MySQL databases with **the same database name** `ccb_portal_db`, allowing you to switch between them and keep data synchronized.

## 🗄️ Database Options

### 1. PostgreSQL (Default)
- **Production Recommended**
- Docker Container with pgAdmin
- Database: `ccb_portal_db`
- Port: `5432`

### 2. MySQL (XAMPP)
- **Development Friendly**
- XAMPP MySQL Server
- Database: `ccb_portal_db` (Same name!)
- Port: `3306`

## 🔄 Unified Database Name

Both databases use the **same name**: `ccb_portal_db`

This means:
- Switch between databases seamlessly
- Same schema structure
- Easy synchronization between databases
- Consistent data organization

## ⚙️ Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# PostgreSQL Configuration (Default)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=ccb_portal_db

# MySQL Configuration (XAMPP)
USE_MYSQL=true                    # Set to 'true' to use MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=                  # Leave empty for XAMPP default
MYSQL_DATABASE=ccb_portal_db      # Same name as PostgreSQL!
```

## 🔄 Switching Databases

### To Use PostgreSQL (Default):
```bash
USE_MYSQL=false
```

### To Use MySQL:
```bash
USE_MYSQL=true
```

## � Database Synchronization

### Manual Sync Commands:

```bash
# Check sync status
node backend/sync-databases.js status

# Sync PostgreSQL → MySQL
node backend/sync-databases.js pg-to-mysql

# Sync MySQL → PostgreSQL  
node backend/sync-databases.js mysql-to-pg
```

### Automatic Sync Workflow:
1. Make changes in one database
2. Switch to the other database
3. Run sync command to transfer data
4. Both databases now have identical data

## �🚀 Setup Instructions

### PostgreSQL Setup:
1. Start Docker PostgreSQL container
2. Access pgAdmin at `http://localhost:5050/browser/`
3. Database `ccb_portal_db` will be auto-created on first run

### MySQL Setup:
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Access phpMyAdmin at `http://localhost/phpmyadmin/`
4. Set `USE_MYSQL=true` in your `.env` file
5. Restart the backend server
6. Database `ccb_portal_db` will be auto-created on first run

## 📊 Database Schema

Both databases have identical schemas with these tables:
- `contacts` - Contact form submissions
- `admin_users` - Admin authentication
- `news` - News articles
- `events` - Events
- `announcements` - Announcements
- `achievements` - Achievements
- `academic_programs` - Academic programs
- `departments` - Departments
- `personnel` - Staff/faculty
- `admission_requirements` - Admission requirements
- `enrollment_steps` - Enrollment process steps
- `admission_notes` - Admission notes
- `institutional_info` - Institutional information
- `downloads` - Downloadable files

## 🔍 Health Check

Check database status:
```bash
GET http://localhost:5000/api/health/db
```

Response example:
```json
{
  "ok": true,
  "postgres": { "ready": true },
  "mysql": { "ready": false, "enabled": false },
  "current": "postgresql"
}
```

## 🛠️ Development Workflow

### Local Development (MySQL):
1. Use XAMPP for easy setup
2. Set `USE_MYSQL=true`
3. Data persists in XAMPP MySQL `ccb_portal_db`

### Production (PostgreSQL):
1. Use Docker PostgreSQL
2. Set `USE_MYSQL=false` (default)
3. Better for production deployment

### Synchronization Workflow:
1. Work in MySQL during development
2. Sync to PostgreSQL before deployment
3. Both databases have identical data

## 📝 Benefits of Same Database Name

- **Seamless Switching**: Change databases without modifying application code
- **Easy Sync**: Same table names and structure
- **Consistent Environment**: Development and production use same database name
- **Simple Backup**: Both databases can be backed up with same name
- **Clear Organization**: Always know you're working with `ccb_portal_db`

## 🔧 Troubleshooting

### MySQL Connection Issues:
- Ensure XAMPP MySQL service is running
- Check port 3306 is available
- Verify MySQL credentials in `.env`
- Confirm database `ccb_portal_db` exists in phpMyAdmin

### PostgreSQL Connection Issues:
- Ensure Docker container is running
- Check port 5432 is available
- Verify PostgreSQL credentials in `.env`
- Confirm database `ccb_portal_db` exists in pgAdmin

### Synchronization Issues:
- Ensure both databases are accessible
- Check table structures match
- Run `node backend/sync-databases.js status` first
- Sync one direction at a time

### Switching Issues:
- Restart backend after changing `USE_MYSQL`
- Clear browser cache if needed
- Check health endpoint for status
- Verify data exists in target database
