import { getSessionUser } from '@/lib/auth/supabase';
import { getUser, getMoodEntries, getAssessments, getInsights } from '@/lib/db/dbHelper';
import { saveSessionNoteAction } from '@/app/actions/therapist';
import MoodTrend from '@/components/charts/MoodTrend';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  TrendingUp, 
  ClipboardList, 
  Heart,
  Bookmark,
  CheckCircle,
  FileText
} from 'lucide-react';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function PatientDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const clinician = await getUser(sessionUser.id);
  if (!clinician || clinician.role !== 'therapist') {
    redirect('/dashboard');
  }

  const patientId = params.id;
  const patient = await getUser(patientId);

  // Guard: patient must exist and be linked to this therapist
  if (!patient || patient.therapistId !== clinician.id) {
    return (
      <div className="p-8 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm">You do not have permission to view this patient's files.</p>
        <Link href="/therapist/dashboard" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const moodEntries = await getMoodEntries(patientId);
  const assessments = await getAssessments(patientId);
  const insights = await getInsights(patientId);
  const latestInsight = insights[0] || null;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/therapist/dashboard"
            className="p-2 border border-stone-250 hover:bg-stone-100 rounded-xl text-stone-500 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-stone-850 flex items-center gap-2">
              {patient.name}
            </h1>
            <p className="text-xs text-stone-400">Linked Patient File • {patient.email}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/report/${patientId}`}
            download
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download PDF Report
          </a>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (8 cols equivalent - chart + assessments) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Weekly Insight Banner */}
          <div className="p-6 rounded-2xl border border-purple-200/50 bg-gradient-to-r from-purple-50/40 via-indigo-50/10 to-emerald-50/10 shadow-sm">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-purple-600" /> Active Insight
            </h3>
            {latestInsight ? (
              <div className="space-y-4">
                <p className="text-stone-700 leading-relaxed text-sm font-sans italic">
                  "{latestInsight.summaryMd}"
                </p>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`px-2 py-0.5 rounded ${
                    latestInsight.riskLevel === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    Risk: {latestInsight.riskLevel}
                  </span>
                  <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded">
                    Trend: {latestInsight.trend}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No weekly summaries computed yet for this patient.</p>
            )}
          </div>

          {/* Mood Trend Area Chart */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-700 tracking-wide">Wellness Trends</h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-stone-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Mood (1-10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#a78bfa]" />
                  <span>Energy (1-10)</span>
                </div>
              </div>
            </div>
            <MoodTrend data={moodEntries.slice(0, 10)} />
          </div>

          {/* Clinical Screenings Logs */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-700 tracking-wide">Screening Evaluations</h3>
            
            {assessments.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {assessments.map((a) => {
                  const isPHQ9 = a.type === 'PHQ9';
                  const isSevere = a.score >= 15;
                  return (
                    <div key={a.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isPHQ9 ? 'bg-primary/10 text-primary' : 'bg-purple-50 text-purple-600'}`}>
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-850">
                            {isPHQ9 ? 'Mood Screen (PHQ-9)' : 'Anxiety Screen (GAD-7)'}
                          </p>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(a.createdAt), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-sm font-bold text-stone-800">{a.score} pts</p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            isSevere ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {a.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 leading-relaxed italic">
                No clinical assessments completed by this patient yet.
              </p>
            )}
          </div>

        </div>

        {/* Right Column (Therapist Session Notes) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Clinician Notes Box */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-700 tracking-wide flex items-center gap-1.5">
              <Bookmark className="h-4.5 w-4.5 text-purple-600" /> Session Notes
            </h3>

            <form
              action={async (formData) => {
                'use server';
                const note = formData.get('notes') as string;
                await saveSessionNoteAction(patientId, note);
              }}
              className="space-y-4"
            >
              <textarea
                name="notes"
                rows={10}
                defaultValue={patient.clinicalNotes || ''}
                placeholder="Type clinician session observations, notes, or treatment plan updates here..."
                className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 text-xs text-stone-700 leading-relaxed resize-none placeholder-stone-400"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" /> Save Clinical Notes
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
