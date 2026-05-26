# Careology Todo App

Full-stack todo application built for the Careology technical test.

The app includes authentication, task management, weather enrichment, drag-and-drop ordering, due dates, tags, search, toast notifications, and an AWS deployment.

Live app: http://careology-todo-app.eu-west-2.elasticbeanstalk.com/

## Documentation

- [Tech test checklist](docs/tech-test-checklist.md)
- [Pre-implementation system design](docs/pre-implementation-system-design.md)
- [Current system design](docs/current-system-design.md)
- [Production readiness evolution plan](docs/production-readiness-evolution.md)

## Features

- Register, login, and logout
- Create, edit, delete, complete, and uncomplete tasks
- Detect the first city name in a task title
- Fetch and display weather data for the detected city
- Add due dates and tags
- Search by task title, description, and tags
- Reorder tasks with drag and drop
- Persist task ordering after refresh
- Show toast notifications for user feedback
- Keep each user's tasks private

## Tech Stack

- React
- TypeScript
- Vite
- MUI
- Apollo Client
- Node.js
- Express
- Apollo Server
- GraphQL
- Prisma
- PostgreSQL
- AWS Elastic Beanstalk
- AWS RDS PostgreSQL
- Vitest
- React Testing Library
- Playwright

## Local Setup

Prerequisites:

- Node.js 24 or newer
- npm
- Docker and Docker Compose

Install dependencies:

```bash
npm install
```

Create the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Update `apps/api/.env` with a local `JWT_SECRET` and, if you want live weather data locally, a `WEATHER_API_KEY`.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

The local PostgreSQL database runs on port `5433`.

Generate Prisma Client and apply migrations:

```bash
npm run db:generate --workspace @careology/api
npm run db:deploy --workspace @careology/api
```

Start the API:

```bash
npm run dev --workspace @careology/api
```

Start the web app in a second terminal:

```bash
npm run dev --workspace @careology/web
```

Open the local app at:

```text
http://localhost:5173
```

The Vite dev server proxies `/graphql` requests to the API on `http://localhost:4000`.

## Validation

Run the main checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run database-backed tests:

```bash
npm run test:db
```

Run browser tests:

```bash
npm run test:e2e
```

## Database

The API uses PostgreSQL with Prisma.

Useful Prisma commands:

```bash
npm run db:validate --workspace @careology/api
npm run db:generate --workspace @careology/api
npm run db:migrate --workspace @careology/api -- --name migration_name
npm run db:deploy --workspace @careology/api
```

Prisma Client is generated into `apps/api/src/generated/prisma/` and is not committed.

Tasks use soft delete with `deletedAt`; API queries scope tasks by the authenticated user.

## Deployment

The production deployment uses:

- AWS Elastic Beanstalk for the Node.js application
- AWS RDS PostgreSQL for the production database

The backend serves the built frontend as static files and exposes GraphQL at `/graphql`.

The deployment bundle is created locally before upload so Elastic Beanstalk installs only runtime dependencies.

Create a deployment bundle:

```bash
./scripts/create-eb-bundle.sh
```

The generated zip files are written to `deploy/`, which is ignored by git.
