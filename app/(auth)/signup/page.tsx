'use client';

import { useState } from 'react';
import { signupAction } from '@/app/actions/auth';
import Link from 'next/link';
import { isRedirectError } from 'next/dist/client/components/redirect';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await signupAction(formData);
      if (result && result.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      if (isRedirectError(err)) throw err;
      setError('An unexpected connection error occurred.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-stone-100 via-emerald-50/20 to-purple-50/20">
      <div className="w-full max-w-md p-8 rounded-2xl glass shadow-xl border border-white/40 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl text-primary font-serif">MindMirror</h1>
          <p className="text-sm text-stone-500 font-sans tracking-wide">
            Begin your journey towards self-reflection
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600 block">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2.5 bg-white/70 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all placeholder-stone-400 text-stone-850"
              placeholder="Priya Sharma"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600 block">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 bg-white/70 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all placeholder-stone-400 text-stone-850"
              placeholder="priya@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600 block">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2.5 bg-white/70 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all placeholder-stone-400 text-stone-850"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Profile...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 font-sans pt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
