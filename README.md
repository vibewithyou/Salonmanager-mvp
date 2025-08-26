# Salonmanager-mvp

## Development

1. Install dependencies (runs in `SalonManager/`):
   ```bash
   npm install
   ```
2. Start the development server (serves API and client):
   ```bash
   npm run dev
   ```
3. Seed demo data (optional):
   ```bash
   curl -X POST http://localhost:5000/api/v1/seed
   ```
   Expected response:
   ```json
   { "ok": true }
   ```
4. Quick test the list endpoint:
   ```bash
   curl http://localhost:5000/api/v1/salons | jq
   ```
   Expect an array of salons.
5. Query bookings for a salon (after creating one):
   ```bash
   curl "http://localhost:5000/api/v1/bookings?scope=salon&salon_id=1&from=2025-08-01&to=2025-08-31" | jq
   ```
   Fetch your bookings (guest returns empty):
   ```bash
   curl "http://localhost:5000/api/v1/bookings?scope=me" | jq
   ```
6. Open `http://localhost:5000` in your browser.

### .env example

Create `SalonManager/.env` with:

```env
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB
SESSION_SECRET=dev_secret_change_me
REPLIT_DOMAINS=localhost
PORT=5000
```

### Local DB

Use any Postgres database and set `DATABASE_URL` accordingly.
For a quick local instance via Docker:

```yaml
db:
  image: postgres:16
  restart: unless-stopped
  environment:
    POSTGRES_USER: user
    POSTGRES_PASSWORD: pass
    POSTGRES_DB: salonmanager
  ports:
    - "5432:5432"
```

After the database is running, run the seed command above to populate demo data.

The development server runs both the Express backend and the Vite-powered frontend on the same port.
