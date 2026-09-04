# Equipment Lending Portal — API

Express + Mongoose + Clerk backend matching the API schema in `server.js`'s mounted routes.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI` — from your Atlas cluster's "Connect > Drivers" page
   - `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` — from your Clerk dashboard
3. `npm run seed` — creates the collections and adds sample equipment so the catalogue isn't empty
4. `npm run dev` — starts the API on `http://localhost:4000`

Check it's alive: `curl http://localhost:4000/health`

## How auth works here

Every protected route is guarded by `requireUser` (`middleware/auth.js`). It reads the Clerk session from `req.auth` (attached by `clerkMiddleware()`, mounted globally in `server.js`), then loads or lazily creates the matching Mongo `User` document and attaches it as `req.dbUser`. Route handlers only ever read `req.dbUser` — never `req.auth` directly — so if you later add a Clerk webhook to sync profiles properly, you change one file.

To make someone an admin for testing: flip their `role` field to `'admin'` directly in the `users` collection (Atlas UI or a one-off script) — there's no admin-promotion endpoint by design, that's not something you want exposed over HTTP in a hackathon build.

## Where the AI condition-check plugs in

`services/aiCondition.js` exports `compareConditionPhotos(pickupPhotos, returnPhotos)`. It's currently a stub that always returns `{ similarityScore: null, flagged: false }`. `routes/bookings.js`'s `/:id/return-condition` handler already calls it and stores whatever it returns — swap the function body for the real similarity check and nothing else needs to change.

## Routes

See `routes/*.js` — one file per resource, matching:

```
/api/users/*      -> routes/users.js
/api/equipment/*  -> routes/equipment.js
/api/bookings/*   -> routes/bookings.js
/api/activity/*   -> routes/activity.js
/api/admin/*      -> routes/admin.js
```
