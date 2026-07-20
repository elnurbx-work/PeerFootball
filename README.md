# FanPitch

FanPitch is a football social network for amateur players and fans. Phase 2 wires Google and email/password authentication, Auth.js sessions, protected app routes, email verification, and persisted user profile editing.

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
- Auth.js / NextAuth Google OAuth and credentials auth
- Zod

## Environment

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

Prisma CLI is configured through `prisma.config.ts`, which loads `.env.local` first and then `.env` when those files exist. Keep real local secrets in `.env.local`.

Required variables:

```bash
DATABASE_URL=""
DIRECT_URL=""
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM="FanPitch <no-reply@example.com>"
ABLY_API_KEY=""
MESSAGE_ENCRYPTION_KEY=""
```

Use `npx auth secret` or another secure generator for `AUTH_SECRET`.

Email verification uses Resend. Set `RESEND_API_KEY` and `EMAIL_FROM` before using email/password registration; verification links are only sent by email.

Cloudinary is optional for favorite-team logos:

```bash
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

When these variables are not configured, FanPitch stores the original TheSportsDB image URL for the selected team.

## Favorite Teams

Favorite teams are stored per user in PostgreSQL. FanPitch does not keep a global football club database, seed every club, or maintain a shared team catalog.

Team search runs through the server route at `/api/profile/team-search`, which calls TheSportsDB server-side and returns a small normalized result list. Client components never call TheSportsDB directly.

When Cloudinary is configured, selected team logos are mirrored into the `peerfootball/favorite-teams` folder. If Cloudinary upload fails or is not configured, the app keeps the original TheSportsDB logo URL and does not block the save flow.

Profile rendering reads favorite teams only from PostgreSQL data. It does not call TheSportsDB while loading profile pages.

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

## Google AdSense

AdSense is disabled by default and fails closed when the client ID, feed slot, or in-feed layout key is missing or invalid. Configure these public build-time variables locally in `.env.local` and, for deployment, in Vercel under Project Settings -> Environment Variables for each intended environment:

```bash
NEXT_PUBLIC_ADSENSE_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT_ID="ca-pub-1234567890123456"
NEXT_PUBLIC_ADSENSE_FEED_SLOT="1234567890"
NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY=""
NEXT_PUBLIC_ADSENSE_FEED_INTERVAL=2
NEXT_PUBLIC_ADSENSE_MAX_FEED_ADS=5
```

In AdSense, create an In-feed ad unit, copy the account client ID (`ca-pub-...`) into `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, the numeric ad-slot into `NEXT_PUBLIC_ADSENSE_FEED_SLOT`, and its non-empty layout key into `NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY`. Set `NEXT_PUBLIC_ADSENSE_ENABLED=true` only after all required values are configured, then redeploy because `NEXT_PUBLIC_*` values are embedded at build time. Configure the variables for Vercel Production (not only Preview) and create a new deployment after every change.

The main `/feed` inserts one manual ad after every two real posts by default, using the complete rendered post array rather than resetting at page boundaries. Change `NEXT_PUBLIC_ADSENSE_FEED_INTERVAL` to adjust that interval and `NEXT_PUBLIC_ADSENSE_MAX_FEED_ADS` to cap ads in a long feed (default: five). Empty feeds and all other routes—including authentication, direct messages, settings, admin, post creation, account-management, payment, loading, and error screens—do not render ad units. The AdSense script is mounted once from the root layout but only loads on `/feed` when configuration is valid.

The committed `public/ads.txt` contains the publisher declaration using the required `pub-...` form (not `ca-pub-...`). After deployment, verify that `https://YOUR_DOMAIN/ads.txt` returns that declaration as plain text.

Google and advertising partners may use cookies or similar technologies for advertising measurement and may show personalized or non-personalized ads depending on consent and region. The project owner must reflect this in the published privacy and cookie information. For users in the EEA, United Kingdom, or Switzerland, configure a Google-certified consent management platform through AdSense Privacy & Messaging or another certified CMP before enabling ads; this repository does not claim GDPR compliance and does not include a CMP. If consent support is added, gate the AdSense script on advertising consent.

The site and ad unit must be approved by AdSense before real ads can display. Test serving on the approved production domain: localhost and Vercel Preview may remain unfilled. Also verify that the production domain registered in AdSense matches the deployed canonical domain. Configure Auto Ads so it does not inject excessive additional units into the manually monetized feed. Do not click your own ads or use real ad clicks for testing.

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

## Manual Realtime Chat Test

1. Login as User A in Chrome.
2. Login as User B in Incognito or another browser.
3. Make sure A and B are accepted friends.
4. Open the same Direct conversation in both browsers.
5. Send a message from A.
6. B must see it without refresh.
7. Send a message from B.
8. A must see it without refresh.
9. Delete a message.
10. The other side must see the deletion without refresh.
11. Keep the Direct list open in one browser.
12. Send a message from the other browser.
13. The last message must update and move the conversation to the top without refresh.
14. Open the chat room in both browsers.
15. Online status must show when both users are in the room.
16. Close one browser or tab.
17. The other side should change to offline after disconnect or leave.

## Deployment

Deploy the Next.js app to Vercel and add these project environment variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL` set to your production URL
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

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
- Email/password registration and login
- Email verification tokens with optional Resend delivery
- Prisma adapter models for accounts, sessions, and verification tokens
- Protected Profile, Feed, Teams, and Matches routes
- Current user helper
- Logout from the header
- Persisted profile editing with Zod validation
- Default username generation for new Google users

Not included yet:

- Payments
- Video editing
- Client-side cryptographic key management
- Redis
- Cloudinary uploads
- Advanced notifications
