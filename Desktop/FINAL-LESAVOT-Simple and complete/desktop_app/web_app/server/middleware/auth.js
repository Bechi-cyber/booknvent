/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens and protects routes that require authentication.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes that require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const { data: user, error } = await req.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user changed password after the token was issued
    if (user.password_changed_at) {
      const changedTimestamp = parseInt(user.password_changed_at.getTime() / 1000, 10);
      
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          status: 'error',
          message: 'User recently changed password. Please log in again.'
        });
      }
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please log in again.'
      });
    }
    
    req.logger.error('Authentication error:', err);
    
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please log in again.'
    });
  }
};

/**
 * Middleware to restrict access to certain roles
 * @param  {...String} roles - Roles that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
