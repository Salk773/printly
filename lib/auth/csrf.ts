import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * CSRF protection utilities
 * Generates and validates CSRF tokens
 */

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get or create CSRF token from cookies
 */
export function getCsrfToken(): string {
  const cookieStore = cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = generateToken();
    // Token will be set by middleware or response headers
  }

  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Get token from header
  const headerToken = req.headers.get("X-CSRF-Token");
  
  // Get token from cookie
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Compare tokens
  return headerToken === cookieToken && headerToken.length === CSRF_TOKEN_LENGTH;
}

/**
 * CSRF protection middleware
 * Returns 403 if CSRF token is invalid
 */
export function csrfProtection(req: NextRequest): NextResponse | null {
  // Skip CSRF for GET requests
  if (req.method === "GET" || req.method === "HEAD") {
    return null;
  }

  // Skip CSRF for public read-only endpoints
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/api/health") || pathname.startsWith("/api/products-api") && req.method === "GET") {
    return null;
  }

  if (!validateCsrfToken(req)) {
    return NextResponse.json(
      {
        error: "CSRF token validation failed",
        message: "Invalid or missing CSRF token",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Set CSRF token in response headers
 */
export function setCsrfTokenHeader(res: NextResponse): NextResponse {
  const token = getCsrfToken();
  res.headers.set("X-CSRF-Token", token);
  res.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return res;
}

