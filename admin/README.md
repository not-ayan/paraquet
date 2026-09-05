# Equipment Lending Portal — Admin

Separate Next.js app from the main site, same backend. Runs on port 3001 so
you can have both this and the main frontend (port 3000) running at once.

## Setup

1. First apply the `routes/admin.js` patch to your backend (adds the
   endpoints this app calls) and restart the backend.
2. `npm install`
3. Copy `.env.example` to `.env.local`, fill in the same Clerk keys as the
   other two apps, and `NEXT_PUBLIC_API_URL` (`http://localhost:4000`)
4. `npm run dev` — opens on `http://localhost:3001`

**Every page in this app requires an admin account.** Sign in with an
account whose `role` field is `"admin"` in MongoDB (see `backend/README.md`
for how to set that). Signing in as a regular user gets you past Clerk's
gate but every API call will 403 — the pages show that as a plain error
message rather than a crash.

## Pages → backend endpoints

- `/equipment/pending` → `GET/PATCH /api/admin/equipment/pending`, `.../approve`, `.../reject`
- `/equipment` → `GET /api/admin/equipment` (all items, any status) + `PATCH /api/equipment/:id` to change availability
- `/bookings/pending` → `GET/PATCH /api/admin/bookings/pending`, `.../approve`, `.../reject`
- `/bookings/flagged` → `GET /api/admin/bookings/flagged`, `PATCH .../resolve-condition` — this is the "handle damaged equipment" screen: shows pickup vs. return photos side by side, admin clears it or attaches a damage fee
- `/users` → `GET /api/admin/users`
- `/logs` → `GET /api/admin/activity`
