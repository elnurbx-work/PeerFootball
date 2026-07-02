# FanPitch

FanPitch is a football social network for amateur players and fans. Phase 2 wires real Google authentication, Auth.js sessions, protected app routes, and persisted user profile editing.

## Privacy Architecture

FanPitch is moving toward a privacy-first data model. The database keeps operational metadata in plaintext where the server needs it for routing, access control, abuse prevention, and product workflows. Examples include user IDs, email, username, profile image URL, relationship rows, conversation membership, timestamps, visibility settings, and delivery/read metadata.

Sensitive user-authored content is designed to be encrypted before it reaches the server. The schema now includes encrypted profile storage, encrypted post content fields, and encrypted direct-message content fields. Direct messages must be stored as ciphertext only; the server should never persist direct-message plaintext.

This phase prepares the database and permission helpers. It does not implement full client-side cryptography, real-time messaging, notifications, payment, or video features.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- Neon Postgres
- Auth.js / NextAuth Google OAuth
- Zod

## Environment

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

Prisma CLI reads `.env` by default. For local Prisma commands, either copy the same values into `.env` too or run the commands from a shell where `DATABASE_URL` is already exported.

Required variables:

```bash
DATABASE_URL=""
DIRECT_URL=""
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

Use `npx auth secret` or another secure generator for `AUTH_SECRET`.

## Neon Setup

1. Create a Neon project.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Copy the direct/unpooled connection string into `DIRECT_URL`.
4. Keep both values in `.env.local` locally and in Vercel project environment variables for deployment.

## Google OAuth Setup

Create OAuth credentials in Google Cloud Console:

1. Go to APIs & Services -> Credentials.
2. Create an OAuth client ID for a Web application.
3. Add this local redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

4. Add your deployed Vercel redirect URI after deployment:

```text
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

5. Put the client ID in `AUTH_GOOGLE_ID` and client secret in `AUTH_GOOGLE_SECRET`.

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the schema to your database:

```bash
npx prisma db push
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Useful Commands

```bash
npx prisma validate
npx prisma generate
npm run build
```

The app also includes `npm run lint`, but Next.js 15 no longer ships the old `next lint` command. Replace that script with an ESLint CLI config when linting is needed.

## Deployment

Deploy the Next.js app to Vercel and add these project environment variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL` set to your production URL
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

After Vercel gives you the production domain, add the production Google callback URL in Google Cloud and redeploy.

## Project Structure

```text
src/
  actions/       Server actions for auth, profile, posts, teams, matches
  app/           App Router pages, auth route handler, and global styles
  components/    Layout, feature components, and UI primitives
  lib/           Prisma client, auth helpers, validation, utilities
  types/         Shared TypeScript and Auth.js types
prisma/
  schema.prisma  Database schema
  seed.ts        Sample development data
```

## Phase 2 Scope

Included:

- Google login with Auth.js v5
- Prisma adapter models for accounts, sessions, and verification tokens
- Protected Profile, Feed, Teams, and Matches routes
- Current user helper
- Logout from the header
- Persisted profile editing with Zod validation
- Default username generation for new Google users

Not included yet:

- Payments
- Video editing
- Real-time chat
- Client-side cryptographic key management
- Redis
- Cloudinary uploads
- Advanced notifications
