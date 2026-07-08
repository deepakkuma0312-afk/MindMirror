'use strict';
'use server';

import { getSessionUser } from '@/lib/auth/appwrite';
import { addAssessment, addAlert, getUser } from '@/lib/db/dbHelper';
import { revalidatePath } from 'next/cache';

// Severity grading logic
function getSeverity(type: 'PHQ9' | 'GAD7', score: number): string {
  if (type === 'GAD7') {
    if (score >= 15) return 'Severe';
    if (score >= 10) return 'Moderate';
    if (score >= 5) return 'Mild';
    return 'Minimal';
  } else {
    if (score >= 20) return 'Severe';
    if (score >= 15) return 'Moderately Severe';
    if (score >= 10) return 'Moderate';
    if (score >= 5) return 'Mild';
    return 'Minimal';
  }
}

export async function saveAssessmentAction(type: 'PHQ9' | 'GAD7', responses: Record<number, number>) {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'You must be logged in to complete assessments.' };
  }

  // Calculate score
  const score = Object.values(responses).reduce((sum, val) => sum + val, 0);
  const severity = getSeverity(type, score);

  try {
    const assessment = await addAssessment({
      userId: user.id,
      type,
      responses,
      score,
      severity,
    });

    // Alert therapist if score is high (Severe levels are >= 15)
    if (score >= 15) {
      const profile = await getUser(user.id);
      if (profile?.therapistId) {
        await addAlert({
          userId: user.id,
          therapistId: profile.therapistId,
          type: 'assessment_severe',
          severity: 'warning',
          message: `${profile.name || 'Patient'} scored "${severity}" on their ${
            type === 'PHQ9' ? 'Mood Screen (PHQ-9)' : 'Anxiety Screen (GAD-7)'
          } checkup. Score: ${score}.`,
        });
      }
    }

    revalidatePath('/assessments');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      score, 
      severity 
    };
  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return { error: error.message || 'Failed to submit assessment.' };
  }
}
