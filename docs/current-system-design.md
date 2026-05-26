# Current System Design

This document summarises the current system design for the Careology Todo App technical test. My goal was to keep the solution simple enough to review, but still close to how I would structure a real full-stack product: clear boundaries, predictable data ownership, safe error handling, and a deployment setup that matches the application architecture.

## Architecture Overview

The project is organised as an npm workspace monorepo:

- `apps/web` contains the React and TypeScript frontend.
- `apps/api` contains the Node.js GraphQL backend.
- `packages/shared` contains shared contracts, validation limits, and error codes used by both the frontend and backend.

The backend exposes a GraphQL API through Apollo Server running inside an Express app. The same Express app also serves the production frontend build as static files. In production, the frontend calls GraphQL through `/graphql`, so the deployed app works as a single Elastic Beanstalk service.

On the backend, I kept GraphQL resolvers thin. Resolvers translate GraphQL input into service calls, while the service layer owns the actual business rules. Prisma-specific query details are kept in repository modules. This avoids mixing GraphQL transport concerns, business logic, and persistence details in the same files.

On the frontend, I followed the same separation of concerns. Auth, task board state, form handling, GraphQL operations, responsive task layouts, toast notifications, and reusable UI pieces are split into focused modules and components instead of being pushed into one large page component.

## PostgreSQL Decision

I chose PostgreSQL because the app data is naturally relational. Users own tasks, tasks need ordering, completion state, due dates, soft delete, tags, search, and weather snapshots. PostgreSQL handles those relationships and filters cleanly, and Prisma gives a typed migration-friendly layer on top of it.

DynamoDB would have satisfied the AWS bonus requirement, but it would have forced a less natural data model for this app. For a todo app with authenticated ownership and multiple task filters, PostgreSQL is easier to reason about, easier to test, and closer to the local development setup.

## Tag Model

I did not create a separate `Tag` table. For this technical test, tags behave as a controlled priority-style vocabulary rather than a full user-managed tagging system. The app supports the required tag feature without needing tag ownership, tag colours stored in the database, autocomplete, analytics, global renaming, or many-to-many tag management.

The current solution stores tags directly on the task as string values. The frontend and backend share the same allowed tag vocabulary through `@careology/shared`, so direct API callers cannot persist arbitrary tag values that the UI cannot display or edit cleanly.

This keeps the model small and clear while still meeting the requirement for tags and search.

## Weather Algorithm

Weather enrichment is handled on the backend because the WeatherAPI key must not be exposed in the browser bundle. The frontend never calls WeatherAPI directly. Instead, task creation and relevant task updates go through the API, and the backend decides whether weather data should be attached to the task.

The city detection algorithm is intentionally simple and deterministic. It looks for the first city-like phrase after location prepositions such as `for`, `in`, `near`, `to`, `from`, and `at`.

For example:

```text
I need to travel to London and then from London to Paris
```

This resolves to `London`, because `to London` is the first location-like phrase. The backend sends only that first candidate to WeatherAPI and lets WeatherAPI validate whether it is a real location.

Due dates affect which WeatherAPI endpoint is used:

- If there is no due date, the app fetches current weather.
- If the due date is today, the app fetches current weather.
- If the due date is within the supported forecast window, the app fetches forecast weather for that date.
- If the date is outside the supported forecast window or no city can be resolved, the task is still saved without weather.

Weather is treated as optional enrichment. A WeatherAPI failure does not block task creation. The task is the core user action; weather is supporting data. When a task title or due date changes and the new lookup cannot produce valid weather, stale weather is cleared so the UI does not show misleading old data.

Weather values are stored as a task snapshot: city, temperature, condition, icon URL, and fetched timestamp. This avoids calling the external API on every render and keeps the task board fast and predictable.

## Authentication and Error Handling

Authentication is custom and JWT-based. Users register and log in through GraphQL mutations. Passwords are hashed with bcrypt, and the API stores only the password hash.

Logout is handled on the frontend by clearing stored auth state and Apollo cache. Since the current backend uses stateless JWTs, there is no server-side session record to destroy.

Error handling is centralised around stable application error codes. Expected backend failures use typed app errors, and the frontend maps those codes to user-friendly messages. Unexpected server errors are masked so internal details are not exposed to the browser.

This gives the app one consistent error flow across backend services, GraphQL responses, frontend forms, task actions, and toast notification feedback.

## Deployment

The deployed app uses two AWS services:

- AWS Elastic Beanstalk for hosting the Node.js application.
- AWS RDS PostgreSQL for the production database.

Elastic Beanstalk runs the Express/Apollo app as a single Node.js service. The backend serves `/graphql` and also serves the frontend static build. This keeps deployment simple and avoids splitting the technical test into separate frontend and backend hosting paths.

RDS PostgreSQL keeps production persistence aligned with local development and Prisma migrations.

During deployment, I avoided making the small Elastic Beanstalk instance install and build the full monorepo. Instead, the app is built before deployment and packaged into a lean runtime bundle. Elastic Beanstalk installs production dependencies, runs Prisma migrations with `migrate deploy`, and starts the app.

## Testing Strategy

The test strategy is split by risk level.

Backend unit tests cover validation, services, repositories, auth utilities, task rules, weather parsing, and error handling. GraphQL integration-style tests cover resolver and service wiring. Database-backed persistence tests cover cases that mocks cannot fully prove, especially ownership, soft delete, filtering, and ordering.

Frontend tests use React Testing Library with Apollo mocks. They cover auth flows, task board interactions, form validation, toast notification feedback, responsive UI states, and GraphQL state transitions.

Playwright covers the main browser-level flows end to end: registration, login, task creation, search, editing, completion, deletion, weather display, mobile menu interactions, and drag-and-drop ordering persistence.

WeatherAPI is mocked in E2E tests so the browser suite stays deterministic and does not depend on third-party network availability, rate limits, or live response changes.

## System Flow

The user interacts with the React and TypeScript frontend in the browser. In production, the built frontend is served by the Express backend as static files.

The frontend sends GraphQL requests to `/graphql`. The Express and Apollo GraphQL API routes those requests into thin resolvers, and the resolvers delegate business rules to focused services.

Authentication is handled by the auth service, task ownership and task operations are handled by the task service, and weather enrichment is handled by the weather service. Prisma is the single database access layer, and AWS RDS PostgreSQL is the production data store.

The Elastic Beanstalk Node.js application hosts the backend process and serves the static frontend build from the same deployment package.
