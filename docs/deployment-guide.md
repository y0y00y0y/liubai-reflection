# Liubai Deployment Guide

This project is a monorepo:

- `web`: Next.js frontend
- `server`: FastAPI backend

Recommended low-cost setup:

- Frontend: Vercel, with the project root directory set to `web`.
- Backend: Render Web Service, using the root `render.yaml`.
- Database: Neon Postgres free tier or another managed PostgreSQL database.

## Backend

Create a PostgreSQL database first, then deploy the backend service.

Required environment variables:

```env
APP_ENV=production
SECRET_KEY=replace-with-a-long-random-string
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
CORS_ORIGINS=https://your-vercel-domain.vercel.app
LLM_PROVIDER=auto
OPENAI_API_KEY=
GEMINI_API_KEY=
```

After deployment, verify:

```text
https://your-backend-domain/health
```

The expected response is:

```json
{"status":"ok"}
```

## Frontend

On Vercel:

```text
Root Directory: web
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Required environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain
```

## Deployment Order

1. Create the PostgreSQL database and copy its connection string.
2. Deploy the backend service and set `DATABASE_URL`, `SECRET_KEY`, and `CORS_ORIGINS`.
3. Verify `/health`.
4. Deploy the frontend from the `web` directory on Vercel.
5. Set `NEXT_PUBLIC_API_BASE_URL` to the backend HTTPS domain.
6. Register a new account and verify login, saving, seeing records, and review aggregation.
