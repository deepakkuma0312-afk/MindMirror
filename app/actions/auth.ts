'use strict';
'use server';

import { cookies } from 'next/headers';
import { isSupabaseConfigured, getServerSupabase, getSessionUser } from '@/lib/auth/supabase';
import { getUserByEmail, createUser, updateUser, getUser } from '@/lib/db/dbHelper';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const cookieStore = await cookies();

  if (isSupabaseConfigured) {
    const supabase = await getServerSupabase();
    if (!supabase) return { error: 'Auth system unavailable.' };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Get role from DB profile
      const dbUser = await getUser(data.user.id);
      const role = dbUser?.role || '';
      if (role) {
        cookieStore.set('mindmirror-role', role, { path: '/' });
      }
    }
  } else {
    // Local mock auth mode
    const dbUser = await getUserByEmail(email);
    if (!dbUser) {
      return { error: 'Invalid email or password. Hint: In local mode, click Sign Up first to register.' };
    }

    // Set mock cookies
    cookieStore.set('mindmirror-session', JSON.stringify({ id: dbUser.id, email: dbUser.email }), { path: '/' });
    if (dbUser.role) {
      cookieStore.set('mindmirror-role', dbUser.role, { path: '/' });
    }
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

  if (isSupabaseConfigured) {
    const supabase = await getServerSupabase();
    if (!supabase) return { error: 'Auth system unavailable.' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create user profile in db
      await createUser(data.user.id, email, name, 'patient'); // default to patient, onboarding changes it
    }
  } else {
    // Local mock auth mode
    const existing = await getUserByEmail(email);
    if (existing) {
      return { error: 'Email already registered. Try logging in.' };
    }

    // Generate simulated user ID
    const mockId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const newUser = await createUser(mockId, email, name, 'patient');

    // Set mock cookies
    cookieStore.set('mindmirror-session', JSON.stringify({ id: newUser.id, email: newUser.email }), { path: '/' });
    cookieStore.set('mindmirror-role', 'patient', { path: '/' });
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

  if (isSupabaseConfigured) {
    const supabase = await getServerSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  // Clear mock session cookies
  cookieStore.delete('mindmirror-session');
  cookieStore.delete('mindmirror-role');

  redirect('/login');
}
