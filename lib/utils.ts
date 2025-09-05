import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Redis } from '@upstash/redis'
import { LineParams } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses error messages from API responses
 */
/**
 * Checks if a visitor has exceeded their rate limit without incrementing the counter
 * @param visitorId The unique identifier for the visitor
 * @param limitKey The key to identify this specific rate limit
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns Object containing whether the request is allowed and when the rate limit resets
 */
export const checkRateLimitOnly = async (
  visitorId: string,
  limitKey: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; resetsAt: number }> => {
  if (!redis) {
    console.warn('Redis Client is not initialized, rate limiting disabled');
    return { allowed: true, resetsAt: Date.now() + windowMs }; // Allow if Redis is not available
  }
  
  try {
    const now = Date.now();
    const key = `ratelimit:${limitKey}:${visitorId}`;
    
    // Get current count and timestamp
    const data = await redis.get(key);
    let rateLimitData;
    
    if (data) {
      // Handle both string and object responses from Redis
      if (typeof data === 'string') {
        try {
          rateLimitData = JSON.parse(data);
        } catch (e) {
          console.warn('Failed to parse rate limit data:', e);
          rateLimitData = { count: 0, timestamp: now };
        }
      } else if (typeof data === 'object') {
        // Redis client might already return parsed object
        rateLimitData = data;
      } else {
        rateLimitData = { count: 0, timestamp: now };
      }
    } else {
      rateLimitData = { count: 0, timestamp: now };
    }
    
    // Reset window if expired
    if (now - rateLimitData.timestamp > windowMs) {
      rateLimitData = { count: 0, timestamp: now };
    }
    
    // Calculate when the rate limit resets
    const resetsAt = rateLimitData.timestamp + windowMs;
    
    // Check limit
    if (rateLimitData.count >= maxRequests) {
      return { allowed: false, resetsAt }; // Rate limit exceeded
    }
    
    return { allowed: true, resetsAt }; // Within rate limit
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true, resetsAt: Date.now() + windowMs }; // Fail open
  }
};

/**
 * Checks if a visitor has exceeded their rate limit and increments the counter
 * @param visitorId The unique identifier for the visitor
 * @param limitKey The key to identify this specific rate limit
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns Object containing whether the request is allowed and when the rate limit resets
 */
export const checkRateLimit = async (
  visitorId: string,
  limitKey: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; resetsAt: number }> => {
  // First check if already rate limited
  const checkResult = await checkRateLimitOnly(visitorId, limitKey, maxRequests, windowMs);
  
  // If already rate limited, just return the result
  if (!checkResult.allowed) {
    return checkResult;
  }
  
  if (!redis) {
    console.warn('Redis Client is not initialized, rate limiting disabled');
    return { allowed: true, resetsAt: Date.now() + windowMs }; // Allow if Redis is not available
  }
  
  try {
    const now = Date.now();
    const key = `ratelimit:${limitKey}:${visitorId}`;
    
    // Get current count and timestamp
    const data = await redis.get(key);
    let rateLimitData;
    
    if (data) {
      // Handle both string and object responses from Redis
      if (typeof data === 'string') {
        try {
          rateLimitData = JSON.parse(data);
        } catch (e) {
          console.warn('Failed to parse rate limit data:', e);
          rateLimitData = { count: 0, timestamp: now };
        }
      } else if (typeof data === 'object') {
        // Redis client might already return parsed object
        rateLimitData = data;
      } else {
        rateLimitData = { count: 0, timestamp: now };
      }
    } else {
      rateLimitData = { count: 0, timestamp: now };
    }
    
    // Reset window if expired
    if (now - rateLimitData.timestamp > windowMs) {
      rateLimitData = { count: 0, timestamp: now };
    }
    
    // Calculate when the rate limit resets
    const resetsAt = rateLimitData.timestamp + windowMs;
    
    // Check limit
    if (rateLimitData.count >= maxRequests) {
      return { allowed: false, resetsAt }; // Rate limit exceeded
    }
    
    // Increment count and update Redis
    rateLimitData.count++;
    
    // Make sure we're storing a string in Redis
    const serializedData = JSON.stringify(rateLimitData);
    const expirySeconds = Math.ceil(windowMs / 1000);
    
    await redis.set(key, serializedData, { ex: expirySeconds });
    
    return { allowed: true, resetsAt }; // Within rate limit
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true, resetsAt: Date.now() + windowMs }; // Fail open
  }
};

/**
 * Format a date into a human-readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

export function parseError(error: string) {
  const regex = /{"error":(.*)}/gm;
  const m = regex.exec(error);
  try {
    const e = m?.[1];
    const err = JSON.parse(e || '{}');
    return err.message || error;
  } catch {
    return error;
  }
}

/**
 * Parses a simple linear equation string into a structured object for graphing.
 * Handles formats: y=mx+b, x=c, y=c.
 * @param rawEquation The equation string, e.g., "$$y = 2x - 3$$"
 * @returns An object with line parameters or null if parsing fails.
 */
export function parseEquation(rawEquation: string): LineParams | null {
  // 1. Clean the string
  const eq = rawEquation
    .replace(/\$\$/g, '') // Remove MathJax delimiters
    .replace(/\\/g, '') // Remove backslashes
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/\{|\}/g, ''); // Remove braces e.g. from \frac{}{}

  // Case 1: Vertical line, x = c
  let match = eq.match(/^x=(-?\d+\.?\d*)$/);
  if (match) {
    return {type: 'vertical', x: parseFloat(match[1])};
  }

  // Case 2: Horizontal line, y = c
  match = eq.match(/^y=(-?\d+\.?\d*)$/);
  if (match) {
    return {type: 'horizontal', y: parseFloat(match[1])};
  }

  // Case 3: Slope-intercept, y = mx + b (e.g., y=2x+3, y=x-4, y=-x+1, y=-2.5x)
  match = eq.match(/^y=((-?\d*\.?\d*)\*?)?x(([+\-]\d+\.?\d*))?$/);
  if (match) {
    const mStr = match[2];
    let m = 1.0;
    if (mStr === '-') {
      m = -1.0;
    } else if (mStr !== undefined && mStr !== '') {
      m = parseFloat(mStr);
    }

    const bStr = match[3];
    const b = bStr ? parseFloat(bStr) : 0.0;

    return {type: 'slope-intercept', m, b};
  }

  // Fallback for more complex forms like ax+by=c (simple parsing)
  match = eq.match(/^(-?\d*\.?\d*)\*?x([+\-]\d*\.?\d*)\*?y=(-?\d+\.?\d*)$/);
  if (match) {
    const a = parseFloat(match[1] || '1');
    const b = parseFloat(match[2].replace('+', '') || '1');
    const c = parseFloat(match[3]);
    if (b !== 0) {
      return {type: 'slope-intercept', m: -a / b, b: c / b};
    }
  }

  return null; // Return null if no format matches
}

// Initialize Redis client for analytics
let redis: Redis | undefined;
if (
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL &&
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
    token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn('Upstash credentials not found. Analytics disabled.');
}

/**
 * Logs a specific event to Upstash Redis for analytics.
 * This is a fire-and-forget function.
 * @param eventName The name of the event to track (e.g., 'problem_submitted').
 * @param visitorId Optional visitor ID to track events per visitor.
 */
export const logAnalyticsEvent = async (eventName: string, visitorId?: string) => {
  if (!redis) {
    // Analytics are disabled if redis client is not initialized
    console.warn('Redis Client is not initialized!')
    return;
  }

  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fire-and-forget promise. We don't await it so it doesn't block UI.
    redis.incr(`analytics:olympiad_tutor:${eventName}`);
    
    // Also track daily stats
    redis.incr(`analytics:olympiad_tutor:daily:${today}:${eventName}`);
    
    // If visitor ID is provided, track per-visitor analytics
    if (visitorId) {
      // Increment event counter for this specific visitor
      redis.incr(`analytics:olympiad_tutor:visitor:${visitorId}:${eventName}`);
      
      // Add this visitor to a set of visitors who triggered this event
      redis.sadd(`analytics:olympiad_tutor:${eventName}:visitors`, visitorId);
      
      // Add to daily visitors set
      redis.sadd(`analytics:olympiad_tutor:daily:${today}:visitors`, visitorId);
      
      // Store the timestamp of this event for the visitor
      const timestamp = Date.now();
      redis.zadd(`analytics:olympiad_tutor:visitor:${visitorId}:timeline`, { score: timestamp, member: `${eventName}:${timestamp}` });
    }
  } catch (error) {
    // Log errors to console but don't let analytics failure block the user.
    console.error(`Failed to log analytics event '${eventName}':`, error);
  }
};
