'use client';

import { useState } from 'react';
import { onboardingAction } from '@/app/actions/auth';
import { Heart, ShieldAlert, Sparkles, User, UserCheck } from 'lucide-react';
import { isRedirectError } from 'next/dist/client/components/redirect';

export default function OnboardingPage() {
  const [role, setRole] = useState<'patient' | 'therapist'>('patient');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await onboardingAction(role);
      if (res && res.error) {
        setError(res.error);
        setPending(false);
      }
    } catch (e: any) {
      if (isRedirectError(e)) throw e;
      setError('An unexpected error occurred. Please try again.');
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-stone-100 via-emerald-50/20 to-purple-50/20">
      <div className="w-full max-w-2xl p-8 rounded-2xl glass shadow-xl border border-white/40 space-y-8 font-sans">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
            Onboarding
          </span>
          <h1 className="text-4xl text-stone-800 font-serif mt-1">Choose Your Mirror</h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Select how you would like to experience MindMirror. This setting determines your dashboard layout and feature sets.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Option */}
            <div
              onClick={() => setRole('patient')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 text-left space-y-4 hover:shadow-md ${
                role === 'patient'
                  ? 'border-primary bg-primary/5 shadow-inner'
                  : 'border-stone-200/80 bg-white/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-3 rounded-lg ${role === 'patient' ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600'}`}>
                  <User className="h-5 w-5" />
                </div>
                {role === 'patient' && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800">Individual</h3>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  Track your mood conversational-first, write interactive journals, complete clinical assessments, and securely share data with your therapist.
                </p>
              </div>
            </div>

            {/* Therapist Option */}
            <div
              onClick={() => setRole('therapist')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 text-left space-y-4 hover:shadow-md ${
                role === 'therapist'
                  ? 'border-primary bg-primary/5 shadow-inner'
                  : 'border-stone-200/80 bg-white/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-3 rounded-lg ${role === 'therapist' ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600'}`}>
                  <UserCheck className="h-5 w-5" />
                </div>
                {role === 'therapist' && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800">Licensed Therapist</h3>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  Monitor linked patients, receive real-time behavioral drift and crisis warnings, analyze clinical history, and export professional care reports.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? 'Initializing Your Profile...' : 'Confirm and Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
