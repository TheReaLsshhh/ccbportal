## What’s Already Implemented
- The backend already uses PostgreSQL via the `pg` driver and initializes the DB connection on startup in [server.js](file:///c:/CodingProjects/ccbwebmain/backend/server.js#L30-L113).
- It loads environment variables from a **root** `.env` file (repo root), not from `backend/.env`: [server.js](file:///c:/CodingProjects/ccbwebmain/backend/server.js#L12-L14).
- If you provide `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`, the backend will:
  - Create the database automatically (only in this mode) if your DB user has permission.
  - Create required tables (`contacts`, `admin_users`) automatically on first start.
- In production/hosted setups, you can instead set `DATABASE_URL` (optionally `PGSSL=true`).

## Local PostgreSQL Setup (No Code Changes)
1. Create a root `.env` by copying from [.env.example](file:///c:/CodingProjects/ccbwebmain/.env.example).
2. Set Postgres connection values to match your local install:
   - `PGHOST=localhost`
   - `PGPORT=5432`
   - `PGUSER=postgres` (or your local user)
   - `PGPASSWORD=<your postgres user password>`
   - `PGDATABASE=ccb_portal_db` (or any DB name you prefer)
3. Ensure the DB and user exist:
   - If your `PGUSER` can create databases, the backend will auto-create `PGDATABASE`.
   - If not, create it manually in pgAdmin/psql (and make sure the user owns it or has privileges).
4. Install dependencies:
   - Install frontend deps in repo root.
   - Install backend deps in `backend/`.
5. Start backend, then frontend:
   - Backend uses port `5000` by default.
   - Frontend uses port `3000` by default and proxies API to `127.0.0.1:5000`.

## Verification Steps
- Confirm backend prints “Connected to PostgreSQL database.” on startup.
- Confirm tables exist in `PGDATABASE`:
  - `contacts`
  - `admin_users`
- If you see auth/password errors, fix `PGPASSWORD` (or switch to `DATABASE_URL`).

## Optional Improvements I Can Implement in the Repo
1. Make `.env.example` safer/less misleading by blanking `PGPASSWORD` and adding a short note.
2. Add a short `README` section: “Local PostgreSQL Setup (Windows)” with exact fields and troubleshooting.
3. Add a `/api/health/db` endpoint to show DB readiness (`dbReady`) for easy debugging.

## Deliverables After You Confirm
- Updated `.env.example` and docs to guide Postgres setup.
- (Optional) health endpoint for quick “is DB connected?” confirmation.
- Quick verification steps to ensure your local PostgreSQL works end-to-end.
