import { getSessionUser } from '@/lib/auth/supabase';
import { getUser, getMoodEntries, getAssessments, getInsights } from '@/lib/db/dbHelper';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import ReportDocument from '@/components/shared/ReportDocument';

export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Role verification
    const clinician = await getUser(sessionUser.id);
    if (!clinician || clinician.role !== 'therapist') {
      return new Response('Access Denied. Therapists only.', { status: 403 });
    }

    const userId = params.userId;
    const patient = await getUser(userId);
    
    if (!patient || patient.therapistId !== clinician.id) {
      return new Response('Access Denied. This patient is not linked to you.', { status: 403 });
    }

    const moodEntries = await getMoodEntries(userId);
    const assessments = await getAssessments(userId);
    const insights = await getInsights(userId);

    // Render PDF stream using react-pdf server utility
    // We instantiate using React.createElement to keep this route.ts file free from JSX syntax
        const pdfBuffer = await renderToBuffer(
      React.createElement(ReportDocument, {
        patient,
        moodEntries,
        assessments,
        insights,
      }) as any
    );

    return new Response(new Uint8Array(pdfBuffer) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=mindmirror_report_${patient.name || 'patient'}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new Response(`PDF Export Failed: ${error.message}`, { status: 500 });
  }
}
