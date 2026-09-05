const { clerkMiddleware, clerkClient } = require('@clerk/express');
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
    let userId = req.auth?.userId;

    let clientName = req.headers['x-user-name'] 
      ? decodeURIComponent(req.headers['x-user-name']) 
      : (req.body?.borrowerName || req.body?.name);
    let clientEmail = req.headers['x-user-email'] 
      ? decodeURIComponent(req.headers['x-user-email']) 
      : (req.body?.borrowerEmail || req.body?.email);
    let clientAvatar = req.headers['x-user-avatar']
      ? decodeURIComponent(req.headers['x-user-avatar'])
      : (req.body?.avatarUrl || req.body?.userAvatar);

    if (!userId) {
      if (clientEmail || clientName) {
        userId = `guest_${(clientEmail || clientName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      } else {
        return res.status(401).json({ error: 'Unauthorized: Please sign in or provide student details' });
      }
    }

    // If client email was not passed in headers (e.g. admin app direct token call),
    // fetch user profile directly from Clerk API to ensure role/email mapping is exact.
    if ((!clientEmail || !clientAvatar) && clerkClient?.users) {
      try {
        const cu = await clerkClient.users.getUser(userId);
        if (cu) {
          if (!clientEmail && cu.emailAddresses?.length) {
            clientEmail = cu.emailAddresses[0].emailAddress;
          }
          if (!clientName) {
            clientName = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.username;
          }
          if (!clientAvatar && cu.imageUrl) {
            clientAvatar = cu.imageUrl;
          }
        }
      } catch (err) {
        // Fallback silently if Clerk API rate limits or network issues occur
      }
    }

    let user = await User.findOne({
      $or: [
        { clerkId: userId },
        ...(clientEmail ? [{ email: clientEmail }] : [])
      ]
    });

    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: clientEmail || `${userId}@placeholder.local`,
        name: clientName || 'Campus Borrower',
        avatarUrl: clientAvatar,
      });
    } else {
      let needSave = false;
      if (!user.clerkId || user.clerkId !== userId) {
        user.clerkId = userId;
        needSave = true;
      }
      if (clientName && (!user.name || user.name === 'Student Borrower' || user.name === 'Campus Borrower' || user.name !== clientName)) {
        user.name = clientName;
        needSave = true;
      }
      if (clientEmail && (!user.email || user.email.includes('placeholder.local'))) {
        user.email = clientEmail;
        needSave = true;
      }
      if (clientAvatar && user.avatarUrl !== clientAvatar) {
        user.avatarUrl = clientAvatar;
        needSave = true;
      }
      if (needSave) {
        await user.save();
      }
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
