# Influencer Marketplace

An Expo and TypeScript app for local businesses to post offers and creators to apply. Supabase provides email authentication and the database. The project includes offer creation and editing, applications, profile screens, and a small role-based workflow.

## Run

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env
npm start
```

Fill `.env` with your Supabase project URL and client key before starting. Without configuration, the app shows a setup screen. Client keys belong in the app; service-role keys do not.

In a fresh Supabase project, run [supabase/schema.sql](supabase/schema.sql) and enable email authentication. This file initializes the schema; it is not an incremental migration for an existing database. Email confirmation settings determine whether new users can sign in immediately.

## Verify

```sh
npm test
npm run typecheck
npm run build:web
```

The database tests use an isolated PostgreSQL engine with a mock `auth.users` table and `auth.uid()` function. They exercise signup triggers, ownership checks, private application visibility, duplicate prevention, immutable participant IDs, status transitions, and automatic deal creation. They do not connect to a live Supabase project.

## Data and permissions

Businesses own offers. Influencers own applications. Application status changes are available to the offer owner; accepted applications create a deal through a trigger. Row policies restrict visibility, and column grants prevent clients from changing signup roles or moving applications to another participant. Closed offers are visible to their owner and cannot accept new applications.

`lib/api.ts` contains data operations; `hooks/useAuth.ts` handles session restoration and subscription cleanup. Session failures return users to login instead of leaving a loading screen open.

## Current limits

This remains an MVP: no payments, messaging, moderation, or production monitoring. The Expo 52 dependency tree still has inherited audit findings; a tested Expo SDK upgrade is required before a production release. TypeScript checks and a web export pass, but real-device login and live database behavior have not been verified.

See [project structure](docs/project-structure.md) and [API examples](docs/example-api-calls.md).
