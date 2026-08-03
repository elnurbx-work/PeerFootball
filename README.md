# PeerFootball

PeerFootball is a football social network for amateur players and fans. Phase 2 wires Google and email/password authentication, Auth.js sessions, protected app routes, email verification, and persisted user profile editing.

## Privacy Architecture

PeerFootball is moving toward a privacy-first data model. The database keeps operational metadata in plaintext where the server needs it for routing, access control, abuse prevention, and product workflows. Examples include user IDs, email, username, profile image URL, relationship rows, conversation membership, timestamps, visibility settings, and delivery/read metadata.

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
EMAIL_FROM="PeerFootball <no-reply@example.com>"
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

When these variables are not configured, PeerFootball stores the original TheSportsDB image URL for the selected team.

## Favorite Teams

Favorite teams are stored per user in PostgreSQL. PeerFootball does not keep a global football club database, seed every club, or maintain a shared team catalog.

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

## Google AdSense and consent

AdSense is disabled by default and fails closed when its public build-time variables are missing or invalid. Configure them locally in `.env.local` and in the production deployment environment:

```bash
NEXT_PUBLIC_ADSENSE_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT_ID="ca-pub-1234567890123456"
NEXT_PUBLIC_ADSENSE_FEED_SLOT="1234567890"
NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY=""
NEXT_PUBLIC_ADSENSE_FEED_INTERVAL=2
NEXT_PUBLIC_ADSENSE_MAX_FEED_ADS=5
```

Copy the account client ID (`ca-pub-...`) and ad-unit values from AdSense. Set `NEXT_PUBLIC_ADSENSE_ENABLED=true` only after the production domain and ad unit are approved, then redeploy because `NEXT_PUBLIC_*` values are embedded at build time. The script is consent-gated and route-gated to substantial guide detail pages. Private routes, empty states, authentication screens, settings, messaging, admin and the private feed are not monetized.

The committed `public/ads.txt` contains the publisher declaration using the required `pub-...` form (not `ca-pub-...`). After deployment, verify that `https://YOUR_DOMAIN/ads.txt` returns that declaration as plain text.

Google and advertising partners may use cookies or similar technologies. The built-in banner separates necessary, preference, analytics and advertising choices and blocks AdSense until advertising consent is granted. For regions where Google requires a certified CMP, configure one through AdSense Privacy & Messaging before enabling ads; the repository does not claim legal compliance by itself.

The site and ad unit must be approved by AdSense before real ads can display. Test serving on the approved production domain: localhost and Vercel Preview may remain unfilled. Also verify that the production domain registered in AdSense matches the deployed canonical domain. Configure Auto Ads so it does not inject excessive additional units into the manually monetized feed. Do not click your own ads or use real ad clicks for testing.

## Public content and SEO checks

Public pages expose only privacy-safe DTOs. Private profiles, closed clubs, pending match proposals, internal matches, direct messages and account routes are excluded from public queries, robots and sitemap output.

```bash
npm run content:audit
npm run audit:public -- https://your-production-domain.example
```

`content:audit` is dry-run only. A candidate can be hidden reversibly only when both `--apply` and `ALLOW_CONTENT_MODERATION_APPLY=true` are supplied through `npm run content:moderate`; the script never deletes posts.

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

## Web Push notifications

PeerFootball uses the existing `/sw.js`, the browser Push/Notifications APIs and `web-push` with VAPID. Push is an additional delivery channel; database notifications and `/notifications` remain the source of truth. A separate subscription is retained for each browser profile/device.

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Configure all deployment environments (the private key must never use a `NEXT_PUBLIC_` prefix):

```env
NEXT_PUBLIC_WEB_PUSH_ENABLED=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@peerfootball.app"
```

Apply and generate the database schema using this repository's schema-push workflow:

```bash
npm run prisma:push
npx prisma generate
```

`prisma db push` creates the `PushSubscription` table and preference columns. The seed command only inserts sample data and does not replace schema synchronization. In development, `/sw.js` is registered only when `NEXT_PUBLIC_WEB_PUSH_ENABLED=true`; otherwise old PeerFootball service workers and `fanpitch-pwa-*` caches are removed to avoid stale debugging state. Chrome DevTools → Application → Service Workers can also unregister a stale worker manually.

If Prisma's schema engine cannot reach Neon from the current network, use the idempotent HTTP fallback and verify the result:

```bash
npm run prisma:sync-push
npm run verify:push-schema
```

Manual verification checklist:

1. Install dependencies, generate VAPID keys, configure the four environment variables, and run `npm run prisma:push`.
2. Sign in on Android Chrome and open Settings → Notifications.
3. Press “Enable push notifications”; confirm permission is requested only after this click.
4. In development, press “Send test notification”.
5. Close the browser and trigger another notification from a second account.
6. Click the system notification and verify the same-origin PeerFootball destination opens or focuses.
7. Disable notifications in Settings and verify this device no longer receives pushes.
8. Repeat with a second browser/device to verify independent subscriptions.
9. On iOS/iPadOS 16.4+, add PeerFootball from Safari with “Add to Home Screen”, open the installed PWA, and repeat the enable/test/disable flow.

Automated push unit checks run with:

```bash
npm run test:push
npm run test:push-api
```

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
