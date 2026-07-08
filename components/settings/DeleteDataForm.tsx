'use client';

import { useState } from 'react';
import { deleteUserDataAction } from '@/app/actions/settings';
import { Trash2 } from 'lucide-react';
import { isRedirectError } from 'next/dist/client/components/redirect';

export default function DeleteDataForm() {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteUserDataAction();
      if (res && res.error) {
        setError(res.error);
        setConfirm(false);
        setLoading(false);
      }
    } catch (err: any) {
      if (isRedirectError(err)) throw err;
      setError('Failed to complete request.');
      setConfirm(false);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-4 text-left font-sans">
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-rose-900">Danger Zone: Delete All Data</h4>
        <p className="text-[11px] text-rose-700/80 leading-relaxed">
          Clicking the button below will immediately and permanently delete your profile, all mood entries, transcripts of AI conversations, screening results, and weekly insights. This action is irreversible.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleDelete}>
        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-2.5 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
            confirm ? 'bg-red-700 hover:bg-red-800' : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {loading 
            ? 'Purging Records...' 
            : confirm 
            ? 'Are you absolute sure? Click to Confirm.' 
            : 'Permanently Delete My Data'
          }
        </button>
      </form>
    </div>
  );
}
