# Production Readiness Evolution Plan

## Purpose

This document explains how I would evolve the current Careology Todo App into a more production-ready system without jumping into unnecessary complexity too early.

The current solution is intentionally simple: the frontend talks to a GraphQL API, the API stores data in PostgreSQL, and weather enrichment happens as part of the task flow. That is the right baseline for this stage because it is easy to reason about, easy to test, and fast enough for the expected usage.

My production approach would be evolutionary. I would first strengthen the synchronous system, then introduce asynchronous processing only where the product or traffic level clearly needs it.

## Current Baseline

The current application uses a React and TypeScript frontend, a Node.js GraphQL backend, Prisma, PostgreSQL, JWT authentication, and WeatherAPI integration.

In production, the app is deployed as a single Elastic Beanstalk application. The backend serves the built frontend as static files and exposes GraphQL at `/graphql`. PostgreSQL is provided by Amazon RDS.

This setup keeps deployment simple and avoids adding infrastructure before the app needs it. It also gives the project a real production database and a real hosted environment, which is the most important first step.

## Step 1: Strengthen the Synchronous Solution

Before introducing queues or workers, I would make the current synchronous system stronger.

The first area is error handling. The API should continue returning safe, structured GraphQL errors with clear error codes, while the frontend should map those errors into form messages, empty states, retry states, and toast notification feedback. This keeps failures understandable without leaking internal details.

The second area is observability. I would make sure the backend logs request failures, authentication failures, weather API failures, and database errors in a consistent format. In production, those logs and metrics should be visible in CloudWatch so that debugging does not depend on manually downloading server logs.

The third area is persistence and data modelling. PostgreSQL remains the source of truth because the app has relational ownership rules: users own tasks, tasks have status, due dates, ordering, tags, and optional weather data. PostgreSQL gives us transactions, constraints, indexes, and predictable querying, which are valuable for this product.

For tags, I would still avoid creating a separate tag table until the product needs global tag management. Today, tags behave like lightweight task labels owned by the task itself. Keeping them directly on the task avoids extra joins and keeps create/edit flows simple. If tags later need autocomplete, analytics, sharing, or global reuse, then a normalised tag table would become worthwhile.

Weather enrichment can also stay synchronous at first, but it should be protected. The app should avoid calling WeatherAPI repeatedly for the same city in a short period of time. A simple cache can reduce external API calls, improve latency, and make the app more resilient when the weather provider is slow or temporarily unavailable.

Deployment can be improved gradually as well. The current single Elastic Beanstalk app is acceptable for the size of the project, but a stronger production setup would separate static frontend hosting from the backend API. The frontend could be served from S3 and CloudFront, while the API runs behind a load balancer with multiple backend instances.

## Strengthened Synchronous Architecture

In the strengthened synchronous version, the browser loads the frontend through CloudFront and S3, while API requests go through a load balancer to one or more backend instances. The backend validates ownership and business rules, persists data in RDS PostgreSQL, reads or writes weather data through a cache, and sends logs and metrics to CloudWatch.

This version is still mainly synchronous. The important difference is that the system becomes easier to scale, easier to observe, and less dependent on one backend process.

## Step 2: Introduce Async Only When Needed

I would not move everything to asynchronous processing immediately. Async systems are powerful, but they add operational complexity: queues, workers, retries, duplicate handling, monitoring, and failure recovery.

The right time to introduce async is when a task does not need to block the user request, or when traffic makes synchronous work too expensive.

Good async candidates would be registration emails, notification emails, weather refresh jobs, long-running enrichment, analytics events, and any future background cleanup. These jobs can be placed on a queue, processed by a worker, and retried safely if they fail.

For reliability, async jobs should use idempotency where duplicate processing is possible, bounded retries for temporary failures, and a dead-letter queue for jobs that keep failing. These are important guardrails, but they do not need to become separate architecture layers until async processing actually exists.

## Async Architecture When Traffic Requires It

When asynchronous processing becomes necessary, the API still handles the request and response flow, but slow or non-critical work moves to a queue. For example, the API can write the main task data to PostgreSQL and then publish a job to SQS for email delivery, background enrichment, or refresh work.

A separate worker consumes jobs from the queue, calls external services such as an email provider or WeatherAPI, and writes any required updates back to PostgreSQL. Failed jobs can be retried, and jobs that keep failing can move to a dead-letter queue. This keeps failures isolated from the main user flow and allows workers to scale separately from the API.

## High Traffic Strategy

Under higher traffic, I would scale the system in layers.

First, I would keep the frontend behind CDN caching so static assets are served cheaply and quickly. Then I would horizontally scale the backend behind a load balancer. After that, I would protect PostgreSQL with sensible indexes, query review, connection pooling, and careful pagination.

Caching would be introduced where the data has a clear freshness boundary. Weather data is the best early example because it does not need to be fetched from the provider on every task creation. Authentication and task data should remain strongly backed by PostgreSQL.

Only after these improvements would I move more work into asynchronous processing. That keeps the architecture understandable while still giving it a clear path to handle more load.

## Summary

The production-ready path for this app is not to replace the current architecture immediately. The better path is to harden what already works.

First, I would improve error handling, observability, deployment shape, persistence guarantees, and caching around weather data. Then, as traffic or product workflows require it, I would introduce asynchronous processing for emails, background enrichment, notifications, and other non-blocking work.

This keeps the system simple while it is small, but gives it a practical path to scale when the app earns that complexity.
