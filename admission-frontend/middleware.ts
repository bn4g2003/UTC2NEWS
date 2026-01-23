/**
 * Next.js Middleware for Authentication
 * Validates JWT tokens and redirects to login on expired/invalid tokens
 * Validates Requirements 2.2, 2.3
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected route patterns
const PROTECTED_ROUTES = [
  '/dashboard',
  '/users',
  '/roles',
  '/students',
  '/programs',
  '/sessions',
  '/import',
  '/filter',
  '/results',
  '/email',
  '/cms',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/tra-cuu',
  '/nganh-tuyen-sinh',
  '/tin-tuc',
  '/huong-dan',
];

/**
 * Check if a path is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Validate JWT token
 * Note: This is a basic validation. For production, consider using a JWT library
 * to verify the token signature and expiration on the server side.
 */
function isValidToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expired
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        return false; // Token has expired
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

/**
 * Middleware function
 * Validates Requirements 2.2: Redirect to login on expired/invalid tokens
 * Validates Requirements 2.3: Validate JWT token before allowing access to protected routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    // Try to get token from cookie first, then check localStorage via header
    let token = request.cookies.get('auth-token')?.value;
    
    // Fallback: check if token exists in localStorage (via custom header from client)
    if (!token) {
      token = request.headers.get('x-auth-token') || undefined;
    }
    
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token
    if (!isValidToken(token)) {
      // Token is invalid or expired, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'expired');
      
      // Clear the invalid token
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      
      return response;
    }

    // Token is valid, allow access
    return NextResponse.next();
  }

  // For all other routes, allow access
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
