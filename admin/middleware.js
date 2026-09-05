import { clerkMiddleware } from '@clerk/nextjs/server';

// Everything in this app is admin-only — protect the whole site, not just
// specific routes. The backend's requireAdmin is still the real gate (a
// signed-in non-admin gets a 403 from the API); this just keeps signed-out
// visitors out of the UI entirely.
export default clerkMiddleware(async (auth) => {
  await auth.protect();
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
