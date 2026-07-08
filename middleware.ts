import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define route classifications
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isOnboardingRoute = pathname === '/onboarding';
  const isPatientRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/checkin') ||
    pathname.startsWith('/journal') ||
    pathname.startsWith('/assessments') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/settings');
  const isTherapistRoute = pathname.startsWith('/therapist');

  // Skip static resources and API routes
  if (
    pathname.includes('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAppwriteConfigured = !!(
    process.env.APPWRITE_ENDPOINT &&
    process.env.APPWRITE_PROJECT_ID &&
    process.env.APPWRITE_DATABASE_ID &&
    process.env.APPWRITE_API_KEY
  );

  // Get session status from cookies
  // Supports both Appwrite token cookies and our local session cookie
  const mockSession = request.cookies.get('mindmirror-session')?.value;
  const appwriteSession = isAppwriteConfigured && request.cookies.get('appwrite-session')?.value;
  const hasSession = !!(mockSession || appwriteSession);

  // If no session and trying to access protected content
  if (!hasSession) {
    if (!isAuthRoute) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // If we have a session and trying to access auth pages (login/signup)
  if (isAuthRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Check role-based routing
  const role = request.cookies.get('mindmirror-role')?.value;

  // If user has no role, they must onboard
  if (!role && !isOnboardingRoute) {
    const onboardingUrl = new URL('/onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Prevent patients from accessing therapist dashboard
  if (role === 'patient' && isTherapistRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Prevent therapists from accessing patient dashboard
  if (role === 'therapist' && isPatientRoute) {
    const therapistUrl = new URL('/therapist/dashboard', request.url);
    return NextResponse.redirect(therapistUrl);
  }

  // Handle root route /
  if (pathname === '/') {
    if (role === 'therapist') {
      return NextResponse.redirect(new URL('/therapist/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/onboarding',
    '/dashboard/:path*',
    '/checkin/:path*',
    '/journal/:path*',
    '/assessments/:path*',
    '/resources/:path*',
    '/settings/:path*',
    '/therapist/:path*',
  ],
};
