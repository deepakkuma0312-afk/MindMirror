'use strict';
'use server';

import { getSessionUser, createAdminClient } from '@/lib/auth/appwrite';
import { getUserByEmail, updateUser, createTherapistLink } from '@/lib/db/dbHelper';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client, Databases, Query } from 'node-appwrite';

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
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');
    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;

    const deleteUserDocs = async (collectionId: string) => {
      try {
        const list = await databases.listDocuments(databaseId, collectionId, [
          Query.equal('userId', user.id),
          Query.limit(100),
        ]);
        for (const doc of list.documents) {
          await databases.deleteDocument(databaseId, collectionId, doc.$id);
        }
      } catch (e) {
        console.error(`Appwrite delete documents failed for collection ${collectionId}:`, e);
      }
    };

    await deleteUserDocs(process.env.APPWRITE_MOOD_ENTRIES_COLLECTION_ID!);
    await deleteUserDocs(process.env.APPWRITE_ASSESSMENTS_COLLECTION_ID!);
    await deleteUserDocs(process.env.APPWRITE_AI_CONVERSATIONS_COLLECTION_ID!);
    await deleteUserDocs(process.env.APPWRITE_INSIGHTS_COLLECTION_ID!);
    await deleteUserDocs(process.env.APPWRITE_ALERTS_COLLECTION_ID!);
    await deleteUserDocs(process.env.APPWRITE_THERAPIST_LINKS_COLLECTION_ID!);

    // Delete user document in users collection
    try {
      await databases.deleteDocument(databaseId, process.env.APPWRITE_USERS_COLLECTION_ID!, user.id);
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
