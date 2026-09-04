const { clerkMiddleware } = require('@clerk/express');
const { User } = require('../models');

// Mount globally in server.js — attaches req.auth on every request when a
// Clerk session token is present (does not itself block unauthenticated ones).
const withClerk = clerkMiddleware();

/**
 * Use on any protected route: confirms req.auth.userId exists, then loads
 * (or lazily creates) the matching Mongo User doc and attaches it as
 * req.dbUser. Every route handler downstream reads req.dbUser, never
 * req.auth directly, so the Clerk<->Mongo sync lives in exactly one place.
 */
async function requireUser(req, res, next) {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // First authenticated request from this Clerk identity — sync a
      // profile. req.auth doesn't carry email/name by default; pass them
      // from the frontend on first call, or backfill later via a Clerk
      // webhook (user.created) if you have time for it post-hackathon.
      user = await User.create({
        clerkId: userId,
        email: req.body?.email || `${userId}@placeholder.local`,
        name: req.body?.name,
      });
    }
    req.dbUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.dbUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { withClerk, requireUser, requireAdmin };
