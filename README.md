# Salonmanager-mvp

## Development

1. Install dependencies:
   ```bash
   cd SalonManager
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
4. Open `http://localhost:5000` in your browser.

The development server runs both the Express backend and the Vite-powered frontend on the same port.
