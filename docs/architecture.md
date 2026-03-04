# Architecture Decision Record (SPA Runtime)

## Rendering strategy
- The application runs as a **client-rendered Single Page Application (SPA)** built with React + Vite.
- Route transitions and page composition are handled in the client runtime.
- No production SSR pipeline is used in the current deployment model.

## Authentication flow
- Authentication uses **Supabase Auth** from the browser via the client Supabase SDK.
- Users log in through the SPA login page, then session state is consumed by client-side auth utilities and protected UI flows.
- Server-only auth utilities are not part of the active production path.

## Data layer
- Primary data source is **Supabase Postgres** accessed with Supabase client APIs.
- The app uses typed models/types and API helper modules to centralize data access behavior.
- Mutations and reads are initiated from client-side flows (forms, dashboard actions, and page-level data hooks).

## Deployment model
- Built as static assets using Vite (`npm run build`) and deployed as a static web app.
- Platform configuration (for example on Vercel) serves the SPA entry point and static assets.
- Experimental SSR-oriented modules are kept outside the production import path to avoid ambiguity in runtime expectations.
