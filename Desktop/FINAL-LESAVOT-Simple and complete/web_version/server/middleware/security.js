/**
 * Security Middleware
 * 
 * This module provides middleware functions for enhancing application security.
 */

const logger = require('../utils/logger');

/**
 * Content Security Policy (CSP) middleware
 * 
 * Adds CSP headers to responses to mitigate XSS and other code injection attacks.
 * 
 * @param {Object} options - CSP configuration options
 * @returns {Function} - Express middleware function
 */
exports.contentSecurityPolicy = (options = {}) => {
  // Default CSP directives
  const defaultDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
    connectSrc: ["'self'", options.apiUrl || ''],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: options.upgradeInsecureRequests ? [] : null,
    blockAllMixedContent: options.blockAllMixedContent ? [] : null
  };

  // Merge with custom directives
  const directives = { ...defaultDirectives, ...options.directives };

  // Remove null directives
  Object.keys(directives).forEach(key => {
    if (directives[key] === null) {
      delete directives[key];
    }
  });

  // Build CSP header value
  const buildCspHeader = () => {
    return Object.entries(directives)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const directive = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        
        // Handle empty array directives (like upgradeInsecureRequests)
        if (Array.isArray(value) && value.length === 0) {
          return directive;
        }
        
        // Handle array directives
        if (Array.isArray(value)) {
          return `${directive} ${value.join(' ')}`;
        }
        
        return null;
      })
      .filter(Boolean)
      .join('; ');
  };

  const cspHeader = buildCspHeader();
  
  logger.info('CSP header configured', { 
    headerLength: cspHeader.length,
    directives: Object.keys(directives)
  });

  // Return middleware function
  return (req, res, next) => {
    // Set CSP header
    res.setHeader('Content-Security-Policy', cspHeader);
    next();
  };
};

/**
 * Cross-Site Request Forgery (CSRF) protection middleware
 * 
 * Adds CSRF protection headers and token validation.
 * 
 * @param {Object} options - CSRF configuration options
 * @returns {Function} - Express middleware function
 */
exports.csrfProtection = (options = {}) => {
  // Generate random token
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Validate token
  const validateToken = (req) => {
    const csrfToken = req.headers['x-csrf-token'] || 
                      req.body?.csrf_token || 
                      req.query?.csrf_token;
    
    if (!csrfToken) {
      return false;
    }

    // Get token from session or cookie
    const storedToken = req.session?.csrfToken || 
                        req.cookies?.csrf_token;
    
    return csrfToken === storedToken;
  };

  // Return middleware function
  return (req, res, next) => {
    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and set token for GET requests
      if (req.method === 'GET') {
        const token = generateToken();
        
        // Store token in session or cookie
        if (req.session) {
          req.session.csrfToken = token;
        } else {
          res.cookie('csrf_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
          });
        }
        
        // Set CSRF token in response header
        res.setHeader('X-CSRF-Token', token);
      }
      
      return next();
    }

    // Validate token for other requests
    if (!validateToken(req)) {
      logger.warn('CSRF token validation failed', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token validation failed'
      });
    }

    next();
  };
};

/**
 * X-Content-Type-Options middleware
 * 
 * Adds X-Content-Type-Options: nosniff header to prevent MIME type sniffing.
 * 
 * @returns {Function} - Express middleware function
 */
exports.noSniff = () => {
  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  };
};

/**
 * X-Frame-Options middleware
 * 
 * Adds X-Frame-Options header to prevent clickjacking attacks.
 * 
 * @param {String} value - Header value (DENY, SAMEORIGIN, ALLOW-FROM)
 * @returns {Function} - Express middleware function
 */
exports.frameGuard = (value = 'DENY') => {
  return (req, res, next) => {
    res.setHeader('X-Frame-Options', value);
    next();
  };
};

/**
 * X-XSS-Protection middleware
 * 
 * Adds X-XSS-Protection header to enable browser's XSS filter.
 * 
 * @returns {Function} - Express middleware function
 */
exports.xssFilter = () => {
  return (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  };
};

/**
 * Strict-Transport-Security middleware
 * 
 * Adds Strict-Transport-Security header to enforce HTTPS.
 * 
 * @param {Object} options - HSTS configuration options
 * @returns {Function} - Express middleware function
 */
exports.hsts = (options = {}) => {
  const maxAge = options.maxAge || 15552000; // 180 days
  const includeSubDomains = options.includeSubDomains !== false;
  const preload = options.preload === true;
  
  let header = `max-age=${maxAge}`;
  if (includeSubDomains) header += '; includeSubDomains';
  if (preload) header += '; preload';
  
  return (req, res, next) => {
    res.setHeader('Strict-Transport-Security', header);
    next();
  };
};
