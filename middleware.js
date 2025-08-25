import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

/**
 * Middleware to handle authentication and security
 * Protects routes and adds security headers
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes that require authentication
  const protectedRoutes = ['/chats', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Define auth routes
  const authRoutes = ['/signin', '/signup'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get the token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Redirect logic for protected routes
  if (isProtectedRoute && !token) {
    // Redirect to signin if accessing protected route without auth
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }
  
  // Redirect logic for auth routes
  if (isAuthRoute && token) {
    // Redirect to chats if accessing auth route while authenticated
    return NextResponse.redirect(new URL('/chats', request.url));
  }
  
  // Handle root path redirect
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/chats', request.url));
    } else {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }
  
  // Continue with the request
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
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
