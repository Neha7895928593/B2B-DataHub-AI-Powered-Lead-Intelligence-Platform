# B2B DataHub

B2B DataHub is a full-stack lead intelligence platform for importing, organizing, filtering, and reviewing business datasets at scale. It is built as a portfolio-ready product that demonstrates practical product thinking across data ingestion, admin workflows, API design, and production deployment.

The platform also includes an insight layer that scores dataset quality and suggests outreach actions for sales operations teams.

## Why this project matters

Sales and operations teams often receive raw CSV or Excel lead files that are inconsistent, duplicated, and difficult to explore. This project turns that workflow into a structured system:

- Upload CSV and Excel lead files
- Map dataset fields into normalized entities
- Organize records by category, country, state, and city
- View dataset summaries and record-level drill-downs
- Score datasets with an AI-style readiness model
- Run the full stack with Docker for production-style deployment

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express
- Database: PostgreSQL
- File handling: Multer, XLSX parser, persistent local storage
- Deployment: Docker, Docker Compose, Nginx

## Highlights

- Production-style container setup with separate frontend/backend services and Nginx reverse proxy
- Nginx-served frontend with `/api` reverse proxy
- PostgreSQL auto-initialization through [`database/init.sql`](./database/init.sql)
- Environment-based configuration for frontend and backend
- AI insights panel for dataset scoring, enrichment signals, and outreach recommendations
- Portfolio-safe docs and starter configuration files

## Project structure

- [Frontend](./Frontend)
- [Backend](./Backend)
- [database/init.sql](./database/init.sql)
- [docker-compose.yml](./docker-compose.yml)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [LICENSE](./LICENSE)

## Run with Docker

1. Create your local env file:

```bash
cp .env.example .env
```

2. Update values if required.

Important:
- Keep `POSTGRES_*` and `PG*` aligned.
- Change `POSTGRES_PORT`, `BACKEND_PORT`, or `FRONTEND_PORT` if those ports are already in use.
- Set a strong `JWT_SECRET` before using signup/login in production.
- Uploads are stored in a persistent Docker volume mounted at `/app/uploads`.

3. Start the full stack:

```bash
docker compose up --build -d
```

4. Default access URLs:

- Frontend: `http://localhost:8081`
- Backend health: `http://localhost:5001/health`

If your machine already uses `8081` or `5432`, change the ports in `.env` before startup.

## Run for local development

### Backend

```bash
cd Backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

Development notes:
- Vite (dev) runs on `http://localhost:8080`
- Frontend API calls default to `/api`
- Vite proxies `/api` to `http://localhost:5001`
- `/admin` now supports real signup/login and protects admin routes with JWT auth

## Database

The PostgreSQL schema is defined in [`database/init.sql`](./database/init.sql). When Docker starts with a fresh volume, the schema is applied automatically.

To reset the database locally:

```bash
docker compose down -v
docker compose up --build
```

## Environment files

- Root env template: [.env.example](./.env.example)
- Backend env template: [Backend/.env.example](./Backend/.env.example)
- Frontend env template: [Frontend/.env.example](./Frontend/.env.example)

## Authorship

Developed and integrated by Neha as a production-style portfolio project with custom frontend, backend, database, and deployment implementation.

## Portfolio notes

- Public visitors can browse the dataset discovery experience without logging in.
- Admin management lives behind `/admin` with signup/login and protected routes.
- For recruiter review, the recommended flow is: browse the public UI first, then sign in to inspect the admin workspace.
- This repository is intended to showcase product structure, deployment readiness, dataset workflows, and clean full-stack organization.
- Strong next milestones are adding automated tests, seeded demo data, and a hosted demo link.
