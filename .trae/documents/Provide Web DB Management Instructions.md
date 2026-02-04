## Direct Answer
- This project does not include a built-in “database management web UI”. To manage PostgreSQL in a browser, use a separate tool like **pgAdmin 4** (most common) or **Adminer**.

## Option A (Recommended): pgAdmin 4 (Web UI)
- Install **pgAdmin 4** on Windows.
- Launch pgAdmin 4 (it runs a local service and opens a browser-based UI).
- In pgAdmin:
  - Add a new server
  - Host: `localhost`
  - Port: `5432`
  - Username: `postgres` (or your `PGUSER`)
  - Password: your local Postgres password
  - Database: `ccb_portal_db` (or your `PGDATABASE`)

## Option B: Adminer (Web UI)
- If you have Docker, run Adminer and open it in the browser.
- Login fields match your `.env` values (System: PostgreSQL, Server: `localhost`, etc.).

## Terminal Access (Not Web, but Useful)
- Use `psql` to connect:
  - `psql -h localhost -p 5432 -U postgres -d ccb_portal_db`

## What I Will Add to the Repo After You Confirm
1. Update README with “Web DB management” section (pgAdmin + Adminer + common connection fields).
2. Add a small “psql quick commands” section for terminal access.
3. (Optional) Add a convenience npm script to open the DB health endpoint URL.
