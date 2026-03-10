// src/middleware/auth.js
// Session-based authentication guard.
// Attach to any route that requires login.

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorised. Please log in.' });
}

module.exports = { requireAuth };