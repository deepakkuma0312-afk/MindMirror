import { getSessionUser } from '@/lib/auth/appwrite';
import { getAlerts, getUser } from '@/lib/db/dbHelper';
import { resolveAlertAction } from '@/app/actions/therapist';
import { format } from 'date-fns';
import { ShieldAlert, Bell, CheckCircle, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function TherapistAlertsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const clinician = await getUser(sessionUser.id);
  if (!clinician || clinician.role !== 'therapist') {
    redirect('/dashboard');
  }

  const alerts = await getAlerts(sessionUser.id);
  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-4xl font-serif text-stone-800">
          Warning <span className="italic font-normal">Alerts</span>
        </h1>
        <p className="text-sm text-stone-500">
          View clinical warnings triggered by patient crisis keywords or severe scoring trends.
        </p>
      </header>

      {/* Grid: Unresolved vs Resolved alerts */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Active Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> Active Triage Warnings
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              {activeAlerts.length} Unresolved
            </span>
          </div>

          <div className="space-y-3">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                return (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-2xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isCritical
                        ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                        : 'bg-amber-50/50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4.5 w-4.5 ${isCritical ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {alert.type === 'crisis' ? 'Crisis Threshold' : 'Anomalous Score Dip'}
                        </span>
                        <span className="text-xs text-stone-400">
                          • {format(new Date(alert.createdAt), 'MMM dd, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed max-w-2xl">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Link
                        href={`/therapist/patients/${alert.userId}`}
                        className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-250 text-stone-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                      >
                        Inspect Patient <ArrowUpRight className="h-3 w-3" />
                      </Link>

                      <form
                        action={async () => {
                          'use server';
                          await resolveAlertAction(alert.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Dismiss
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 border border-dashed border-stone-200 bg-white/40 rounded-2xl text-center">
                <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-stone-700 mt-2">Zero active triages</h4>
                <p className="text-xs text-stone-400 mt-0.5">All monitored patients are reporting stable baselines.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-stone-400" /> Resolved Warnings History
            </h3>
            <span className="text-xs text-stone-400">
              Total Resolved: {resolvedAlerts.length}
            </span>
          </div>

          <div className="space-y-2">
            {resolvedAlerts.length > 0 ? (
              resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-stone-200 bg-white text-stone-600 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-400">
                      Resolved Alert • {format(new Date(alert.createdAt), 'MMM dd, yyyy h:mm a')}
                    </p>
                    <p className="text-xs leading-relaxed">{alert.message}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-500 rounded font-bold uppercase tracking-wider">
                    Resolved
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 italic">No historical warnings found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
