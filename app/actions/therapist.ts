'use strict';
'use server';

import { getSessionUser } from '@/lib/auth/supabase';
import { resolveAlert, updateUser } from '@/lib/db/dbHelper';
import { revalidatePath } from 'next/cache';

export async function resolveAlertAction(alertId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'You must be logged in as a therapist.' };
  }

  try {
    await resolveAlert(alertId);
    revalidatePath('/therapist/dashboard');
    revalidatePath('/therapist/alerts');
    return { success: true };
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return { error: error.message || 'Failed to resolve alert.' };
  }
}

export async function saveSessionNoteAction(patientId: string, note: string) {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'You must be logged in as a therapist.' };
  }

  try {
    await updateUser(patientId, { clinicalNotes: note });
    revalidatePath(`/therapist/patients/${patientId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving clinical note:', error);
    return { error: error.message || 'Failed to save clinical note.' };
  }
}
