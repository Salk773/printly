import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiting
 * For production, use @upstash/ratelimit or similar service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export const RATE_LIMITS = {
  // Public endpoints - more lenient
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Admin endpoints - stricter
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Auth endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
} as const;

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: NextRequest): string {
  // Try to get IP from headers (works with Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";
  
  // For authenticated users, use user ID if available
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    // Use a hash of the token as identifier
    return `auth:${authHeader.substring(0, 20)}`;
  }
  
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(req);
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}`;

  let entry = store[key];

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store[key] = entry;
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware
 * Returns 429 if rate limit exceeded
 */
export function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(req, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

