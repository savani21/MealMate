# MealMate AI

## Team Members

- Avani Savani
- Dhruv Shah
- Krisha Thakar

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS

**Backend:** Node.js, Express

**Database:** MongoDB Atlas

**AI:** OpenRouter

## Prerequisites

- Node.js and npm
- MongoDB Atlas connection string
- OpenRouter API key (for AI-powered features)

## Local setup

### 1. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: long, random secret used to sign tokens
- `OPENROUTER_API_KEY`: key for AI features
- `PORT`: backend port (defaults to 5000)
- `CORS_ORIGINS`: comma-separated frontend origins (defaults to http://localhost:5173)

Start the backend:

```bash
npm run dev
```

For production:

```bash
npm start
```

The health endpoint is available at `/api/health`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env`. Set `VITE_API_URL` to the backend base URL:

- Local: `http://localhost:5000`
- Production: your deployed backend origin, for example `https://your-api.example.com`

Start the frontend:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Deployment configuration

Configure these environment variables in the hosting platforms; do not commit real secrets:

**Backend**
- `MONGO_URI`
- `JWT_SECRET`
- `OPENROUTER_API_KEY`
- `PORT` (normally supplied by the host)
- `CORS_ORIGINS` (include the exact deployed frontend origin)

**Frontend**
- `VITE_API_URL` (deployed backend origin)

After changing frontend environment variables, trigger a new frontend deployment because Vite embeds them at build time.

## Security notes

- Never commit `.env` files or real API keys.
- Keep admin endpoints protected by authentication and admin authorization.
- Store checkout is a demo ordering workflow; it does not process real payments or fulfil real deliveries.
