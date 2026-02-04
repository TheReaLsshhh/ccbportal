# CCB Portal

## Local Development (PostgreSQL)

### 1) Create your `.env`
- Copy `.env.example` to `.env` in the repository root.

Set these PostgreSQL values to match your local install:
- `PGHOST=localhost`
- `PGPORT=5432`
- `PGUSER=postgres` (or your local user)
- `PGPASSWORD=` (your local PostgreSQL user password)
- `PGDATABASE=ccb_portal_db` (or any database name)

Notes:
- The backend loads env vars from the repository root `.env` (not `backend/.env`).
- If you set `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`, the backend will attempt to create `PGDATABASE` automatically if it does not exist (requires the DB user to have permission to create databases).
- Alternatively, you can set `DATABASE_URL=postgres://user:password@host:port/dbname` (commonly used for hosted DBs). In that mode, the backend does not auto-create the database.

### 2) Install dependencies
- In the repository root: install frontend dependencies.
- In `backend/`: install backend dependencies.

### 3) Run the app
- Start the backend (port `5000`): `npm run start-backend` (from the repository root).
- Start the frontend (port `3000`): `npm start` (from the repository root).

### 4) Verify the database connection
- Backend log should show: `Connected to PostgreSQL database.`
- Database should contain these tables after first start:
  - `contacts`
  - `admin_users`

### Web database management
This repo does not include a built-in database admin UI. Use one of these tools:

- **pgAdmin 4 (recommended)**: install pgAdmin 4, open it, and register a server with:
  - Host: `PGHOST` (usually `localhost`)
  - Port: `PGPORT` (usually `5432`)
  - Username: `PGUSER`
  - Password: `PGPASSWORD`
  - Database: `PGDATABASE`
- **DBeaver Community**:
  1. Click **New Database Connection** (the plug icon with a `+`).
  2. Select **PostgreSQL** and click Next.
  3. Fill in the connection settings:
     - **Host**: `localhost`
     - **Database**: `ccb_portal_db` (or your chosen name)
     - **Username**: `postgres`
     - **Password**: your local PostgreSQL password
  4. Click **Test Connection** (it may ask to download drivers automatically).
  5. Click **Finish**.
- **Adminer (alternative)**: if you use Docker, run Adminer and log in with the same connection fields above.

### Terminal access (psql)
If you prefer managing PostgreSQL from the terminal, install `psql` (it comes with PostgreSQL) and run:

`psql -h localhost -p 5432 -U postgres -d ccb_portal_db`

Common `psql` commands:
- `\\l` list databases
- `\\c ccb_portal_db` connect to database
- `\\dt` list tables
- `SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50;`
- `\\q` quit

### Troubleshooting
- **Database not created automatically**: your `PGUSER` likely does not have `CREATEDB` permission. Create the database manually in pgAdmin/psql, or grant the permission.
- **Password/auth errors**: double-check `PGPASSWORD` matches the password you set during PostgreSQL installation (commonly for the `postgres` user).
- **Hosted Postgres requires SSL**: set `DATABASE_URL` and `PGSSL=true`.
