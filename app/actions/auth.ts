'use strict';
'use server';

import { cookies } from 'next/headers';
import { createAdminClient, createSessionClient, getSessionUser } from '@/lib/auth/appwrite';
import { getUserByEmail, createUser, updateUser, getUser } from '@/lib/db/dbHelper';
import { redirect } from 'next/navigation';
import { ID } from 'node-appwrite';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const cookieStore = await cookies();

  const appwrite = await createAdminClient();
  if (!appwrite) return { error: 'Auth system unavailable.' };

  try {
    const session = await appwrite.account.createEmailPasswordSession(email, password);

    // Store Appwrite session secret in cookie
    cookieStore.set('appwrite-session', session.secret, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(session.expire),
    });

    // Get user role from DB profile
    const dbUser = await getUser(session.userId);
    const role = dbUser?.role || '';
    if (role) {
      cookieStore.set('mindmirror-role', role, { path: '/' });
    }
  } catch (error: any) {
    console.error('Appwrite login action error:', error);
    return { error: error.message || 'Invalid email or password.' };
  }

  // Redirect to dashboard (middleware will re-route based on role)
  redirect('/dashboard');
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    return { error: 'Please fill in all fields.' };
  }

  const cookieStore = await cookies();

  const appwrite = await createAdminClient();
  if (!appwrite) return { error: 'Auth system unavailable.' };

  try {
    const userId = ID.unique();
    await appwrite.account.create(userId, email, password, name);

    // Create session immediately
    const session = await appwrite.account.createEmailPasswordSession(email, password);

    // Store Appwrite session secret in cookie
    cookieStore.set('appwrite-session', session.secret, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(session.expire),
    });

    // Create user profile in db
    await createUser(userId, email, name, 'patient'); // default to patient, onboarding changes it
  } catch (error: any) {
    console.error('Appwrite signup action error:', error);
    return { error: error.message || 'Registration failed.' };
  }

  // Go to onboarding to choose role
  redirect('/onboarding');
}

export async function onboardingAction(role: 'patient' | 'therapist') {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'No active session found.' };
  }

  const cookieStore = await cookies();

  // Update user role in DB
  await updateUser(user.id, { role });

  // Update role cookie
  cookieStore.set('mindmirror-role', role, { path: '/' });

  // Redirect to their respective dashboards
  if (role === 'therapist') {
    redirect('/therapist/dashboard');
  } else {
    redirect('/dashboard');
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  const sessionClient = await createSessionClient();
  if (sessionClient) {
    try {
      await sessionClient.account.deleteSession('current');
    } catch (e) {
      console.error('Appwrite delete session failed:', e);
    }
  }

  // Clear session cookies
  cookieStore.delete('appwrite-session');
  cookieStore.delete('mindmirror-session');
  cookieStore.delete('mindmirror-role');

  redirect('/login');
}
