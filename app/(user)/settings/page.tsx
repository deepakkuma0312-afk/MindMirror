import { getSessionUser } from '@/lib/auth/appwrite';
import { getUser } from '@/lib/db/dbHelper';
import LinkTherapistForm from '@/components/settings/LinkTherapistForm';
import DeleteDataForm from '@/components/settings/DeleteDataForm';
import { Shield, Users, Trash2, EyeOff, Lock } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const profile = await getUser(sessionUser.id);
  const isLinked = !!profile?.therapistId;
  let therapistProfile = null;

  if (isLinked) {
    therapistProfile = await getUser(profile!.therapistId!);
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-serif text-stone-800">
          Settings & <span className="italic font-normal">Sharing</span>
        </h1>
        <p className="text-sm text-stone-500">
          Control who has access to your mental wellness data and configure your privacy preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 1. Therapist Link Section */}
        <section className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800">Therapist Connection</h3>
              <p className="text-xs text-stone-400">Share your mood charts and assessments with a licensed provider</p>
            </div>
          </div>

          <LinkTherapistForm 
            isLinked={isLinked} 
            therapistName={therapistProfile?.name} 
            therapistEmail={therapistProfile?.email} 
          />
        </section>

        {/* 2. Privacy & Security */}
        <section className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800">Privacy & Encryption</h3>
              <p className="text-xs text-stone-400">Manage data storage and HIPAA-aligned controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-150 rounded-xl flex gap-3">
              <Lock className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-800">Journal Encryption</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                  Private journal text is encrypted client-side / server-side (AES-256) before entering database logs.
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-150 rounded-xl flex gap-3">
              <EyeOff className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-800">Anonymized Prompts</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                  AI check-ins pass hashed user identities to LLM end-points. Your email, name, and PII are never sent in prompts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. GDPR & Account Deletion */}
        <section className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800">GDPR Compliance</h3>
              <p className="text-xs text-stone-400">Permanently delete your profile and logs from MindMirror servers</p>
            </div>
          </div>

          <DeleteDataForm />
        </section>
      </div>
    </div>
  );
}
