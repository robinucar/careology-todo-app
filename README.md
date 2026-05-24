# Todo App

The goal of this project is to implement the required todo app features and the optional bonus requirements with a clean, modular, and maintainable architecture.

## Scope

This project will include:

- User registration and login
- Logout
- Task creation
- Task editing
- Task deletion
- Marking tasks as done or undone
- Weather information for tasks that contain a city name
- Snackbar notifications
- Drag and drop task ordering
- Due dates
- Tags
- Search
- AWS service usage

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
- As an authenticated user, I want to see a helpful error message if weather data cannot be loaded so that I understand what happened.
- As an authenticated user, I want to assign due dates to tasks so that I can plan my work.
- As an authenticated user, I want to add tags to tasks so that I can organize them.
- As an authenticated user, I want to search tasks by title, description, and tags so that I can quickly find relevant work.
- As an authenticated user, I want to reorder tasks with drag and drop so that I can prioritize my work.
- As an authenticated user, I want reordered tasks to stay in the same order after refresh so that my priorities are preserved.
- As an authenticated user, I want to receive snackbar notifications so that I get clear feedback after actions.

## Tech Stack

- React
- TypeScript
- Vite
- MUI
- Apollo Client
- Node.js
- Apollo Server
- GraphQL
- Prisma
- PostgreSQL
- AWS RDS PostgreSQL
- Vitest
- Playwright

## Local Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run validation checks:

```bash
npm run db:generate --workspace @careology/api
npm run typecheck
npm run lint
npm run test
npm run build
```

The local PostgreSQL database runs on port `5433`.

Environment variables are documented in `.env.example`.

## Database

The API uses PostgreSQL with Prisma.

```bash
cp .env.example apps/api/.env
npm run db:validate --workspace @careology/api
npm run db:generate --workspace @careology/api
npm run db:migrate --workspace @careology/api -- --name migration_name
```

Prisma Client is generated into `apps/api/src/generated/prisma/` and is not committed.

Tasks use soft delete with `deletedAt`; API queries should always scope tasks by the authenticated user.
