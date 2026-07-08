import { getSessionUser } from '@/lib/auth/supabase';
import { getAssessments } from '@/lib/db/dbHelper';
import AssessmentForm from '@/components/assessments/AssessmentForm';
import { format } from 'date-fns';
import { ClipboardList, Calendar, Award, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function AssessmentsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  // Retrieve past assessments
  const pastAssessments = await getAssessments(sessionUser.id);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-serif text-stone-800">
          Clinical <span className="italic font-normal">Checkups</span>
        </h1>
        <p className="text-sm text-stone-500">
          Complete self-reported screenings to identify baseline changes in mood and anxiety.
        </p>
      </div>

      {/* Grid: Form on Top, History below */}
      <div className="space-y-8">
        
        {/* Form area */}
        <div className="p-8 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-6">
          <div className="max-w-xl">
            <h2 className="text-2xl text-stone-800 font-serif">Screening Selection</h2>
            <p className="text-xs text-stone-500 mt-1">
              Select one of our standard mental wellness screenings. These questionnaires are evaluated using standardized clinical criteria.
            </p>
          </div>
          <AssessmentForm />
        </div>

        {/* Screening history */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Screening History</h3>
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure HIPAA-aligned logs
            </span>
          </div>

          {pastAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastAssessments.map((a) => {
                const isPHQ9 = a.type === 'PHQ9';
                return (
                  <div
                    key={a.id}
                    className="p-5 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm flex items-start gap-4 hover:shadow-md transition-all"
                  >
                    <div className={`p-3 rounded-xl ${isPHQ9 ? 'bg-primary/10 text-primary' : 'bg-purple-50 text-purple-600'} shrink-0`}>
                      <ClipboardList className="h-5 w-5" />
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-stone-800">
                            {isPHQ9 ? 'Mood Screen (PHQ-9)' : 'Anxiety Screen (GAD-7)'}
                          </h4>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(a.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          a.score >= 15
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {a.severity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                        <span className="text-stone-400 font-medium">Total Score:</span>
                        <span className="font-bold text-stone-800 bg-stone-50 border border-stone-150 px-2 py-0.5 rounded">
                          {a.score} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/40">
              <ClipboardList className="h-8 w-8 text-stone-300" />
              <h4 className="text-sm font-semibold text-stone-700 mt-2">No screens completed</h4>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                You haven't completed any mood or anxiety checkups yet. Select one above to begin.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
