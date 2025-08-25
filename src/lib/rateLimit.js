/**
 * Simple in-memory rate limiter for API routes
 * Uses sliding window algorithm
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key (IP + user ID)
   * @returns {boolean} - Whether request is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param {string} key - Rate limit key
   * @returns {number} - Remaining requests
   */
  getRemaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      return this.maxRequests;
    }

    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Get reset time for a key
   * @param {string} key - Rate limit key
   * @returns {Date} - Reset time
   */
  getResetTime(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      return new Date(now + this.windowMs);
    }

    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length === 0) {
      return new Date(now + this.windowMs);
    }

    const oldestRequest = Math.min(...validRequests);
    return new Date(oldestRequest + this.windowMs);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Clean up every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for API routes
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Express middleware function
 */
export function rateLimit(options = {}) {
  const {
    windowMs = rateLimiter.windowMs,
    maxRequests = rateLimiter.maxRequests,
    keyGenerator = (req) => {
      // Use IP + user ID if available, otherwise just IP
      const userKey = req.user?.id || 'anonymous';
      return `${req.ip}-${userKey}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res, next) => {
    const key = keyGenerator(req);
    
    if (!rateLimiter.isAllowed(key)) {
      const remaining = rateLimiter.getRemaining(key);
      const resetTime = rateLimiter.getResetTime(key);
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
      });
    }

    // Set rate limit headers
    const remaining = rateLimiter.getRemaining(key);
    const resetTime = rateLimiter.getResetTime(key);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

    // Track response status for skip options
    const originalSend = res.send;
    res.send = function(data) {
      const statusCode = res.statusCode;
      
      if (skipSuccessfulRequests && statusCode < 400) {
        // Don't count successful requests
        const userRequests = rateLimiter.requests.get(key);
        if (userRequests && userRequests.length > 0) {
          userRequests.pop(); // Remove the last request
        }
      }
      
      if (skipFailedRequests && statusCode >= 400) {
        // Don't count failed requests
        const userRequests = rateLimiter.requests.get(key);
        if (userRequests && userRequests.length > 0) {
          userRequests.pop(); // Remove the last request
        }
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Specific rate limiters for different endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `${req.ip}-auth`,
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 messages per minute
  keyGenerator: (req) => `${req.ip}-${req.user?.id || 'anonymous'}-messages`,
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
  keyGenerator: (req) => `${req.ip}-${req.user?.id || 'anonymous'}-uploads`,
});

export default rateLimiter;
