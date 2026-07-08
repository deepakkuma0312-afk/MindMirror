import { getSessionUser } from '@/lib/auth/appwrite';
import { getMoodEntries } from '@/lib/db/dbHelper';
import { decrypt, formatClinicalNote } from '@/lib/utils/encryption';
import JournalForm from '@/components/journal/JournalForm';
import { format } from 'date-fns';
import { Sparkles, Calendar, User, Eye, Lock, MessageSquare } from 'lucide-react';

export const revalidate = 0;

export default async function JournalPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  // Retrieve mood entries
  const entries = await getMoodEntries(sessionUser.id);

  // Decrypt notes and annotate entries
  const decryptedEntries = entries.map((entry) => {
    let decryptedNote = '';
    if (entry.note) {
      decryptedNote = formatClinicalNote(decrypt(entry.note));
    }
    return {
      ...entry,
      note: decryptedNote,
    };
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-serif text-stone-800">
          Reflection <span className="italic font-normal">Journal</span>
        </h1>
        <p className="text-sm text-stone-500">
          Write down your private thoughts or look back at your AI check-in conversations.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Journal form */}
        <div className="lg:col-span-5">
          <JournalForm />
        </div>

        {/* Right Side: Timeline history */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Journal History</h3>
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> End-to-End Encrypted Note
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
            {decryptedEntries.length > 0 ? (
              decryptedEntries.map((entry) => {
                const isAI = entry.source === 'ai';
                return (
                  <div
                    key={entry.id}
                    className="p-5 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-3.5 transition-all hover:shadow-md"
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(entry.createdAt), 'MMMM dd, yyyy • h:mm a')}</span>
                      </div>
                      
                      {/* Source Indicator */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isAI 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/40' 
                          : 'bg-emerald-50 text-primary border border-emerald-200/40'
                      }`}>
                        {isAI ? (
                          <>
                            <Sparkles className="h-2.5 w-2.5" />
                            AI Check-in
                          </>
                        ) : (
                          <>
                            <User className="h-2.5 w-2.5" />
                            Private Note
                          </>
                        )}
                      </span>
                    </div>

                    {/* Indicators block */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400">Mood:</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                          {entry.moodScore}/10
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400">Energy:</span>
                        <span className="text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-md">
                          {entry.energy}/10
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400">Sleep:</span>
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                          {entry.sleepHours ? `${entry.sleepHours} hrs` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Note body */}
                    {entry.note ? (
                      <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap pt-1">
                        {entry.note}
                      </p>
                    ) : (
                      <p className="text-stone-400 text-xs italic leading-relaxed pt-1">
                        Reflected without custom notes.
                      </p>
                    )}

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200/50 px-2 py-0.5 rounded-md"
                          >
                            #{tag === 'cognitive' ? 'focus' : tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-64 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/40">
                <span className="text-4xl">🌱</span>
                <h4 className="text-base font-semibold text-stone-700 mt-2">Your journal is clean</h4>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Write down your first private reflection or start a daily AI check-in to begin tracking your history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
