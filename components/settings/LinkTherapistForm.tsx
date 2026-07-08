'use client';

import { useState } from 'react';
import { linkTherapistAction } from '@/app/actions/settings';
import { Users, AlertTriangle } from 'lucide-react';

interface LinkTherapistFormProps {
  isLinked: boolean;
  therapistName?: string | null;
  therapistEmail?: string | null;
}

export default function LinkTherapistForm({ isLinked, therapistName, therapistEmail }: LinkTherapistFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessName(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await linkTherapistAction(formData);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success) {
        setSuccessName(res.therapistName || 'your therapist');
      }
    } catch (err: any) {
      setError('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (isLinked || successName) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 font-sans">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-primary">
            {(therapistName || successName)?.charAt(0) || 'T'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-850">Linked to {therapistName || successName}</h4>
            {therapistEmail && <p className="text-xs text-stone-400">{therapistEmail}</p>}
          </div>
        </div>
        <p className="text-[11px] text-emerald-700 leading-relaxed">
          Your mood trends, sleep metrics, and clinical assessments are securely synced to their dashboard. Any severe checkups will notify them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-left">
      <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl flex gap-3 text-xs text-stone-500 leading-relaxed">
        <AlertTriangle className="h-5 w-5 text-stone-400 shrink-0" />
        <p>
          You are not currently linked to any healthcare professional. Enter their registered email below to invite them to monitor your profile.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Enter therapist's email (e.g. sharma@example.com)"
          className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm placeholder-stone-400 text-stone-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Linking...' : 'Link Provider'}
        </button>
      </form>
    </div>
  );
}
