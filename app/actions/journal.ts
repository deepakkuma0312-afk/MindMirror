'use strict';
'use server';

import { getSessionUser } from '@/lib/auth/appwrite';
import { addMoodEntry } from '@/lib/db/dbHelper';
import { encrypt } from '@/lib/utils/encryption';
import { revalidatePath } from 'next/cache';

export async function saveJournalAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'You must be logged in to save a journal entry.' };
  }

  const moodScore = parseInt(formData.get('mood') as string);
  const energy = parseInt(formData.get('energy') as string);
  const sleepHours = parseFloat(formData.get('sleep') as string) || 8.0;
  const note = formData.get('note') as string;
  const tagsString = formData.get('tags') as string;

  if (isNaN(moodScore) || isNaN(energy)) {
    return { error: 'Please select values for both mood and energy.' };
  }

  // Parse comma-separated tags
  const tags = tagsString
    ? tagsString
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
    : [];

  // Encrypt sensitive note
  const encryptedNote = encrypt(note || '');

  try {
    await addMoodEntry({
      userId: user.id,
      moodScore,
      energy,
      sleepHours,
      tags,
      note: encryptedNote,
      source: 'manual',
    });

    revalidatePath('/journal');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving journal:', error);
    return { error: error.message || 'Failed to save entry.' };
  }
}
