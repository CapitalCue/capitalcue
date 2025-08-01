import { Request, Response, NextFunction } from 'express';
import { createError } from './error-handler';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class SimpleRateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private getKey(req: Request): string {
    // Use IP address and user ID (if authenticated) as key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id;
    return userId ? `${ip}:${userId}` : ip;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      // Initialize or reset the counter
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    } else {
      // Increment the counter
      this.store[key].count++;
    }

    const current = this.store[key];
    const remainingRequests = Math.max(0, this.maxRequests - current.count);
    const resetTime = Math.ceil((current.resetTime - now) / 1000);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
    });

    if (current.count > this.maxRequests) {
      res.set('Retry-After', resetTime.toString());
      return next(createError(`Rate limit exceeded. Try again in ${resetTime} seconds.`, 429));
    }

    next();
  };
}

// Create different rate limiters for different routes
const generalLimiter = new SimpleRateLimiter(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes
const authLimiter = new SimpleRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes for auth
const uploadLimiter = new SimpleRateLimiter(60 * 60 * 1000, 20); // 20 uploads per hour

export const rateLimiter = generalLimiter.middleware;
export const authRateLimiter = authLimiter.middleware;
export const uploadRateLimiter = uploadLimiter.middleware;