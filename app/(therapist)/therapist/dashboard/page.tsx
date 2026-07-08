import { getSessionUser } from '@/lib/auth/supabase';
import { getLinkedPatients, getAlerts, getInsights, getMoodEntries } from '@/lib/db/dbHelper';
import { resolveAlertAction } from '@/app/actions/therapist';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  MessageSquare,
  ShieldAlert,
  Search
} from 'lucide-react';

export const revalidate = 0;

export default async function TherapistDashboard() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  // 1. Get linked patients
  const patients = await getLinkedPatients(sessionUser.id);

  // 2. Fetch alerts
  const alerts = await getAlerts(sessionUser.id);
  const activeAlerts = alerts.filter((a) => !a.resolved);

  // 3. Compile patient details (risk level, last entry)
  const patientCards = await Promise.all(
    patients.map(async (patient) => {
      const insights = await getInsights(patient.id);
      const latestInsight = insights[0] || null;
      
      const moodEntries = await getMoodEntries(patient.id);
      const latestMood = moodEntries[0] || null;

      let risk = 'low';
      let trend = 'stable';
      let latestSummary = 'No insights generated yet.';

      if (latestInsight) {
        risk = latestInsight.riskLevel;
        trend = latestInsight.trend;
        latestSummary = latestInsight.summaryMd;
      }

      return {
        ...patient,
        risk,
        trend,
        latestSummary,
        lastActive: latestMood ? latestMood.createdAt : null,
        latestMoodScore: latestMood ? latestMood.moodScore : null,
      };
    })
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <header className="space-y-1">
        <h1 className="text-4xl font-serif text-stone-800">
          Patient <span className="italic font-normal">Directory</span>
        </h1>
        <p className="text-sm text-stone-500">
          Clinical oversight pane. Monitor behavioral trend anomalies and triage active alerts.
        </p>
      </header>

      {/* Grid Layout: Warnings on Left, Patient list on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Warnings Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500" /> Warning Feed
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              {activeAlerts.length} Active
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-2 shadow-sm space-y-3.5 transition-all hover:shadow-md ${
                      isCritical
                        ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                        : 'bg-amber-50/50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`h-4.5 w-4.5 ${isCritical ? 'text-rose-600 animate-pulse' : 'text-amber-600'} shrink-0`} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {alert.type === 'crisis' ? 'Crisis Trigger' : 'Extreme Dip'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {format(new Date(alert.createdAt), 'h:mm a')}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">{alert.message}</p>

                    <div className="flex gap-2 justify-end border-t border-stone-100 pt-3">
                      <Link
                        href={`/therapist/patients/${alert.userId}`}
                        className="px-3.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 hover:bg-stone-50 transition-all flex items-center gap-1"
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
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="h-3 w-3" /> Dismiss
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 border border-dashed border-stone-200 rounded-xl text-center bg-white/40">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto opacity-70" />
                <p className="text-xs text-stone-550 font-bold mt-2">Zero Active Warnings</p>
                <p className="text-[10px] text-stone-450 mt-0.5">All patient thresholds remain stable.</p>
              </div>
            )}
          </div>
        </div>

        {/* Patient Directory Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Monitored Patients</h3>
            <span className="text-xs text-stone-400 font-sans">
              Total Linked: {patients.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientCards.length > 0 ? (
              patientCards.map((card) => {
                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-purple-200/50 transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-sm">
                            {card.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-stone-850">{card.name}</h4>
                            <p className="text-[10px] text-stone-400">{card.email}</p>
                          </div>
                        </div>

                        {/* Risk status badge */}
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          card.risk === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : card.risk === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {card.risk} risk
                        </span>
                      </div>

                      {/* Brief insight summary */}
                      <p className="text-xs text-stone-505 leading-relaxed font-sans italic line-clamp-2">
                        "{card.latestSummary}"
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                      <span className="text-[10px] text-stone-400">
                        Active: {card.lastActive ? format(new Date(card.lastActive), 'MMM dd') : 'Never'}
                      </span>

                      <Link
                        href={`/therapist/patients/${card.id}`}
                        className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 group"
                      >
                        Open Profile <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 h-64 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/40">
                <Users className="h-8 w-8 text-stone-300" />
                <h4 className="text-sm font-semibold text-stone-700 mt-2">No linked patients yet</h4>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Share your email address with patients to link their care charts to this dashboard.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
