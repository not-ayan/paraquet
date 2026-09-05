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

    const clientName = req.headers['x-user-name'] 
      ? decodeURIComponent(req.headers['x-user-name']) 
      : (req.body?.borrowerName || req.body?.name);
    const clientEmail = req.headers['x-user-email'] 
      ? decodeURIComponent(req.headers['x-user-email']) 
      : (req.body?.borrowerEmail || req.body?.email);

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: clientEmail || `${userId}@placeholder.local`,
        name: clientName || 'Campus Borrower',
      });
    } else if (clientName && (!user.name || user.name === 'Student Borrower' || user.name === 'Campus Borrower' || user.name !== clientName)) {
      user.name = clientName;
      if (clientEmail && (!user.email || user.email.includes('placeholder.local'))) {
        user.email = clientEmail;
      }
      await user.save();
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
