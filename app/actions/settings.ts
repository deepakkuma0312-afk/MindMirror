'use strict';
'use server';

import { getSessionUser } from '@/lib/auth/supabase';
import { getUserByEmail, updateUser, createTherapistLink } from '@/lib/db/dbHelper';
import { db, getMockData, writeMockData } from '@/lib/db/index';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function linkTherapistAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'Unauthorized session.' };
  }

  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Please specify the therapist email.' };
  }

  try {
    // 1. Look up therapist by email
    const therapist = await getUserByEmail(email);
    if (!therapist || therapist.role !== 'therapist') {
      return { error: 'Therapist not found with that email. Make sure they signed up as a therapist first.' };
    }

    // 2. Update patient profile with therapist ID
    await updateUser(user.id, { therapistId: therapist.id });

    // 3. Create a therapist link record
    await createTherapistLink(therapist.id, user.id, 'active');

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true, therapistName: therapist.name };
  } catch (error: any) {
    console.error('Error linking therapist:', error);
    return { error: error.message || 'Failed to link therapist.' };
  }
}

export async function deleteUserDataAction() {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'Unauthorized session.' };
  }

  try {
    if (db) {
      // Cascade delete is configured on schema references, but let's delete manually to be safe
      await db.delete(schema.moodEntries).where(eq(schema.moodEntries.userId, user.id));
      await db.delete(schema.assessments).where(eq(schema.assessments.userId, user.id));
      await db.delete(schema.aiConversations).where(eq(schema.aiConversations.userId, user.id));
      await db.delete(schema.insights).where(eq(schema.insights.userId, user.id));
      await db.delete(schema.alerts).where(eq(schema.alerts.userId, user.id));
      await db.delete(schema.therapistLinks).where(eq(schema.therapistLinks.userId, user.id));
      await db.delete(schema.users).where(eq(schema.users.id, user.id));
    } else {
      // Mock db clean up
      const data = getMockData();
      
      data.users = data.users.filter((u: any) => u.id !== user.id);
      data.moodEntries = data.moodEntries.filter((m: any) => m.userId !== user.id);
      data.assessments = data.assessments.filter((a: any) => a.userId !== user.id);
      data.aiConversations = data.aiConversations.filter((c: any) => c.userId !== user.id);
      data.insights = data.insights.filter((i: any) => i.userId !== user.id);
      data.alerts = data.alerts.filter((a: any) => a.userId !== user.id);
      data.therapistLinks = data.therapistLinks.filter((l: any) => l.userId !== user.id);

      writeMockData(data);
    }

    // Clear authentication cookies
    const cookieStore = cookies();
    cookieStore.delete('mindmirror-session');
    cookieStore.delete('mindmirror-role');
  } catch (error) {
    console.error('Error deleting user data:', error);
    return { error: 'Could not delete user files.' };
  }

  // Redirect to signup
  redirect('/signup');
}
