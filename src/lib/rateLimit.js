/**
 * Rate limiter using a sliding window algorithm with configurable limits
 */
class RateLimiter {
  constructor() {
    // Store request timestamps in memory
    this.requests = new Map();
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    
    // Cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key (IP + user ID)
   * @param {number} [customMaxRequests] - Optional custom max requests for this check
   * @param {number} [customWindowMs] - Optional custom window duration for this check
   * @returns {Object} - Result with success flag and remaining requests
   */
  isAllowed(key, customMaxRequests, customWindowMs) {
    const now = Date.now();
    const windowMs = customWindowMs || this.windowMs;
    const maxRequests = customMaxRequests || this.maxRequests;
    const windowStart = now - windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return {
        success: true,
        remaining: maxRequests - 1,
        limit: maxRequests,
        resetAt: new Date(now + windowMs)
      };
    }

    // Get existing requests and filter out old ones
    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    const allowed = validRequests.length < maxRequests;
    
    if (allowed) {
      // Add current request and update
      validRequests.push(now);
      this.requests.set(key, validRequests);
    }
    
    return {
      success: allowed,
      remaining: Math.max(0, maxRequests - validRequests.length - (allowed ? 1 : 0)),
      limit: maxRequests,
      resetAt: new Date(now + windowMs)
    };
  }

  /**
   * Get remaining requests for a key
   * @param {string} key - Rate limit key
   * @param {number} [customMaxRequests] - Optional custom max requests
   * @param {number} [customWindowMs] - Optional custom window duration
   * @returns {Object} - Information about rate limit status
   */
  getRemaining(key, customMaxRequests, customWindowMs) {
    const now = Date.now();
    const windowMs = customWindowMs || this.windowMs;
    const maxRequests = customMaxRequests || this.maxRequests;
    const windowStart = now - windowMs;

    if (!this.requests.has(key)) {
      return {
        remaining: maxRequests,
        limit: maxRequests,
        resetAt: new Date(now + windowMs)
      };
    }

    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return {
      remaining: Math.max(0, maxRequests - validRequests.length),
      limit: maxRequests,
      resetAt: new Date(now + windowMs)
    };
  }
  
  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      // Filter out requests outside the current window
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        // Remove empty entries
        this.requests.delete(key);
      } else if (validRequests.length !== requests.length) {
        // Update with only recent requests
        this.requests.set(key, validRequests);
      }
    }
  }
  
  /**
   * Stop the cleanup interval
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
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
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 * @param {Request} request - Next.js request object
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {Promise<Object>} - Result with success flag and rate limit info
 */
export async function rateLimit(request, maxRequests, windowMs) {
  try {
    // Get IP address
    const ip = request.headers?.get('x-forwarded-for') || 
              request.headers?.get('x-real-ip') || 
              'unknown';
    
    // Get user ID from session if available
    let userId = 'anonymous';
    try {
      // Try to get session token from request cookies header
      const cookieHeader = request.headers?.get('cookie');
      if (cookieHeader) {
        const sessionTokenMatch = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?next-auth\.session-token=([^;]+)/);
        if (sessionTokenMatch) {
          // Use part of session token as user identifier
          userId = sessionTokenMatch[1].slice(0, 10);
        }
      }
    } catch (error) {
      console.error('Error getting user ID for rate limiting:', error);
    }
    
    // Create a composite key from IP and user ID
    const key = `${ip}:${userId}`;
    
    // Check if allowed with custom limits if provided
    const result = rateLimiter.isAllowed(key, maxRequests, windowMs);
    
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.resetAt
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request on error but log the issue
    return { 
      success: true,
      error: error.message 
    };
  }
}

/**
 * Apply rate limit headers to a response
 * @param {Response} response - Next.js response object
 * @param {Object} rateLimitResult - Result from rateLimit function
 * @returns {Response} - Response with rate limit headers
 */
export function applyRateLimitHeaders(response, rateLimitResult) {
  if (!response || !rateLimitResult) return response;
  
  // Add standard rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit || 100);
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining || 0);
  
  if (rateLimitResult.resetAt) {
    response.headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt.getTime() / 1000));
  }
  
  return response;
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
