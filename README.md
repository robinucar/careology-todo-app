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

## User Stories

- As a new user, I want to create an account so that I can manage my own tasks.
- As a registered user, I want to log in so that I can access my personal todo list.
- As an authenticated user, I want to log out so that I can safely end my session.
- As an authenticated user, I want to see only my own tasks so that my data stays private.
- As an authenticated user, I want to create a task so that I can track something I need to do.
- As an authenticated user, I want to edit a task so that I can correct or update its details.
- As an authenticated user, I want to delete a task so that I can remove work I no longer need to track.
- As an authenticated user, I want to mark a task as done or undone so that I can track my progress.
- As an authenticated user, I want tasks with city names to show weather information so that I can consider local conditions.
- As an authenticated user, I want the app to use the first detected city name in a task for weather lookup so that weather results are predictable.
- As an authenticated user, I want to see helpful feedback if weather data cannot be loaded so that I understand what happened.
- As an authenticated user, I want to assign due dates to tasks so that I can plan my work.
- As an authenticated user, I want to add tags to tasks so that I can group related work.
- As an authenticated user, I want to search tasks by title, description, and tags so that I can quickly find relevant work.
- As an authenticated user, I want to reorder tasks with drag and drop so that I can set my preferred order.
- As an authenticated user, I want reordered tasks to stay in the same order after refresh so that my list remains consistent.
- As an authenticated user, I want to receive toast notifications so that I get clear feedback after actions.

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

Quick start:

```bash
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres
npm run db:generate --workspace @careology/api
npm run db:deploy --workspace @careology/api
```

Then start the API and web app in separate terminals:

```bash
npm run dev --workspace @careology/api
```

```bash
npm run dev --workspace @careology/web
```

Open the local app at:

```text
http://localhost:5173
```

Detailed setup notes are below.

Install dependencies:

```bash
npm install
```

Create the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Update `apps/api/.env` with a local `JWT_SECRET`.

`WEATHER_API_KEY` is optional for local setup. If it is empty, the app still runs, but tasks will not show live weather data locally.

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

Start the API in the first terminal:

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

This command requires the local PostgreSQL container to be running.

Run browser tests:

```bash
npm run test:e2e
```

This command starts the API, web app, and mocked weather API through Playwright. It also requires the local PostgreSQL container to be running.

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
