# Influencer Marketplace

An Expo 57 and TypeScript app for local businesses to post offers and creators to apply. Supabase provides email authentication and the database. The project includes offer creation and editing, applications, profile screens, and a small role-based workflow.

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
npm run doctor
npm run build:web
```

The database tests use an isolated PostgreSQL engine with a mock `auth.users` table and `auth.uid()` function. They exercise signup triggers, ownership checks, private application visibility, duplicate prevention, immutable participant IDs, status transitions, and automatic deal creation. They do not connect to a live Supabase project.

## Data and permissions

Businesses own offers. Influencers own applications. Application status changes are available to the offer owner; accepted applications create a deal through a trigger. Row policies restrict visibility, and column grants prevent clients from changing signup roles or moving applications to another participant. Closed offers are visible to their owner and cannot accept new applications.

`lib/api.ts` contains data operations; `hooks/useAuth.ts` handles session restoration and subscription cleanup. Session failures return users to login instead of leaving a loading screen open. Restoration cannot overwrite a later sign-out, and native token refresh pauses when the app leaves the foreground. `tests/auth-session.test.ts` exercises delayed restoration, failed storage, and unmount cleanup.

Dependencies were upgraded through SDKs 53–57 with a TypeScript check and web export at each step, following the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/). React and React DOM use patched 19.2.8 releases; only these patch-version checks are excluded from Expo’s version validator. Token refresh follows the [Supabase React Native guide](https://supabase.com/docs/guides/auth/quickstarts/react-native).

## Current limits

This remains an MVP: no payments, messaging, moderation, or production monitoring. The current Expo 57 lockfile still reports inherited audit findings in Metro glob parsing, certificate tooling, and URL decoding. Audit suggestions include incompatible framework downgrades, so those changes have not been applied. TypeScript checks and a web export pass, but real-device login and live database behavior have not been verified.

See [project structure](docs/project-structure.md) and [API examples](docs/example-api-calls.md).
