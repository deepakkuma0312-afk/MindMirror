'use strict';
'use server';

import { getSessionUser, isAppwriteConfigured, createAdminClient } from '@/lib/auth/appwrite';
import { getUserByEmail, updateUser, createTherapistLink } from '@/lib/db/dbHelper';
import { getMockData, writeMockData } from '@/lib/db/index';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client, TablesDB, Query } from 'node-appwrite';

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
    if (isAppwriteConfigured) {
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);
      const tablesDB = new TablesDB(client);
      const databaseId = process.env.APPWRITE_DATABASE_ID!;

      const deleteUserDocs = async (tableId: string) => {
        try {
          const list = await tablesDB.listRows({
            databaseId,
            tableId,
            queries: [
              Query.equal('userId', user.id),
              Query.limit(100),
            ],
          });
          for (const row of list.rows) {
            await tablesDB.deleteRow({ databaseId, tableId, rowId: row.$id });
          }
        } catch (e) {
          console.error(`Appwrite delete rows failed for table ${tableId}:`, e);
        }
      };

      await deleteUserDocs(process.env.APPWRITE_MOOD_ENTRIES_TABLE_ID!);
      await deleteUserDocs(process.env.APPWRITE_ASSESSMENTS_TABLE_ID!);
      await deleteUserDocs(process.env.APPWRITE_AI_CONVERSATIONS_TABLE_ID!);
      await deleteUserDocs(process.env.APPWRITE_INSIGHTS_TABLE_ID!);
      await deleteUserDocs(process.env.APPWRITE_ALERTS_TABLE_ID!);
      await deleteUserDocs(process.env.APPWRITE_THERAPIST_LINKS_TABLE_ID!);

      // Delete user document in users table
      try {
        await tablesDB.deleteRow({ databaseId, tableId: process.env.APPWRITE_USERS_TABLE_ID!, rowId: user.id });
      } catch (e) {
        console.error('Appwrite delete user doc failed:', e);
      }

      // Delete Auth account
      const admin = await createAdminClient();
      if (admin) {
        try {
          await admin.users.delete(user.id);
        } catch (e) {
          console.error('Appwrite delete auth user failed:', e);
        }
      }
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
    const cookieStore = await cookies();
    cookieStore.delete('appwrite-session');
    cookieStore.delete('mindmirror-session');
    cookieStore.delete('mindmirror-role');
  } catch (error) {
    console.error('Error deleting user data:', error);
    return { error: 'Could not delete user files.' };
  }

  // Redirect to signup
  redirect('/signup');
}
