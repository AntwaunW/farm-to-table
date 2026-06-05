// Authentication and authorization middleware
//
// protect        — verifies a JWT and attaches the user to req.user
//                  Use on any route that requires a logged-in user
//
// authorizeRoles — restricts a route to specific roles (e.g. 'farmer', 'consumer')
//                  Must always come AFTER protect in the middleware chain

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token in the Authorization header
// On success, attaches the full user document (without password) to req.user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Strip the "Bearer " prefix to get the raw token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token signature and expiry against our JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the DB so we always have up-to-date data
      // -password ensures the hashed password is never exposed on req.user
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      // Token is expired, tampered, or otherwise invalid
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Returns a middleware function that checks req.user.role against the allowed roles list
// Example usage: router.post('/', protect, authorizeRoles('farmer'), handler)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
