# Fifteen Preview Backend Server

Simple Express + SQLite backend for storing prediction market metadata.

## Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:4000`

## Database Schema

The server uses SQLite with the following schema:

- **id** (TEXT PRIMARY KEY): Market contract address
- **address** (TEXT): Contract address (duplicate for query flexibility)
- **team1** (TEXT): Home team name
- **team2** (TEXT): Away team name
- **image** (TEXT): Match image URL
- **matchStartTime** (INTEGER): Unix timestamp of match start
- **fromBlock** (INTEGER): Block number where market was created
- **createdAt** (INTEGER): Timestamp when record was created
- **marketTerms** (TEXT): Custom market terms and conditions
- **leagueName** (TEXT): League/competition name

## API Endpoints

### POST /api/markets
Create or update a market record.

**Body:**
```json
{
  "id": "0x123...",
  "address": "0x123...",
  "team1": "Arsenal",
  "team2": "Chelsea",
  "image": "https://...",
  "matchStartTime": 1700000000,
  "fromBlock": 12345678,
  "marketTerms": "Market terms...",
  "leagueName": "Premier League"
}
```

### GET /api/markets
Get all markets (limit 100, ordered by creation time).

### GET /api/markets?team1=Arsenal&team2=Chelsea&matchStartTime=1700000000
Query specific market by match details.

### GET /api/markets/:id
Get market by contract address.

## Deployment on Render

### 1. Create a new Web Service on Render

- Connect your GitHub repository
- **Build Command:** `cd server && npm install`
- **Start Command:** `cd server && npm start`
- **Environment:** Node

### 2. No persistent disk needed for development

The SQLite database will be stored in memory on each deploy. For production, you would want to:
- Mount a persistent disk on Render, or
- Migrate to PostgreSQL using Render's managed database

### 3. Environment Variables

Set these in the Render dashboard:
- `PORT`: 4000 (or let Render assign automatically)

### 4. Update Frontend

In your frontend `.env` file (or Render environment variables for the frontend):
```
VITE_API_URL=https://your-backend-app.onrender.com
```

## CORS

The server has CORS enabled for all origins to allow the frontend to connect from any domain.

## Notes

- Database is ephemeral without persistent disk - data will be lost on redeploy
- For production use, consider PostgreSQL or mount a persistent disk
- The server will auto-create the database and schema on startup
