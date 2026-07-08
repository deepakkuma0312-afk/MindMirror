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

  const isSupabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let supabaseProjectId = '';
  if (isSupabaseConfigured) {
    try {
      const urlObj = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      supabaseProjectId = urlObj.hostname.split('.')[0];
    } catch (e) {
      const match = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([a-z0-9\-]+)\.supabase\./i);
      if (match) {
        supabaseProjectId = match[1];
      }
    }
  }

  // Get session status from cookies
  // Supports both Supabase token cookies and our local session cookie
  const mockSession = request.cookies.get('mindmirror-session')?.value;
  const sbCookiePrefix = supabaseProjectId ? `sb-${supabaseProjectId}-` : 'sb-';
  const sbSession = isSupabaseConfigured && request.cookies.getAll().some(c => c.name.startsWith(sbCookiePrefix));
  const hasSession = !!(mockSession || sbSession);

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
