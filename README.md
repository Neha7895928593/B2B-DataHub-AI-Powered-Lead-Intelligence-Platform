# B2B DataHub

A full-stack B2B lead data platform with:
- Public dataset browsing
- Admin dataset upload and management
- Custom fields support
- Order/payment ready backend flow

## Live URLs

- Frontend: https://b2-b-data-hub-ai-powered-lead-intelligence-platform-og0whjjtf.vercel.app  
- Frontend (alt): https://b2-b-data-hub-ai-powered-lead-intel.vercel.app  
- Admin panel: https://b2-b-data-hub-ai-powered-lead-intelligence-platform-og0whjjtf.vercel.app/admin  
- Backend API: https://b2b-datahub-ai-powered-lead-intelligence.onrender.com  
- Health check: https://b2b-datahub-ai-powered-lead-intelligence.onrender.com/health

## Demo Walkthrough

Click the preview below to watch the full walkthrough.

[![Watch the walkthrough](docs/demo/live-video-cover.png)](https://drive.google.com/file/d/17CvUx-Yff5QnrUqozVwKrwIqCZalQOFF/view?usp=sharing)

## Run Locally

```bash
cp .env.example .env
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
docker compose up --build -d
```

- Frontend: http://localhost:8081
- Backend health: http://localhost:5001/health

## Main APIs

- `GET /api/datasets`
- `GET /api/datasets/:id/records`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/admin/manage-data/upload-data`
- `GET /api/admin/orders`

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
