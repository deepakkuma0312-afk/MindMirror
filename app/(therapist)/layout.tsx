import { getSessionUser } from '@/lib/auth/supabase';
import { getUser } from '@/lib/db/dbHelper';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Bell, 
  LogOut, 
  HeartHandshake, 
  Activity 
} from 'lucide-react';

export const revalidate = 0;

export default async function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/login');
  }

  const profile = await getUser(sessionUser.id);
  if (profile?.role !== 'therapist') {
    redirect('/dashboard'); // Patient is routed back to patient dashboard
  }

  const name = profile?.name || 'Therapist';

  return (
    <div className="min-h-screen bg-stone-50/50 flex">
      {/* Therapist Sidebar */}
      <aside className="w-80 h-screen bg-white/70 backdrop-blur-md border-r border-stone-200/60 p-6 flex flex-col justify-between font-sans fixed left-0 top-0 z-30">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-stone-800 leading-tight">MirrorCare</h2>
              <span className="text-[10px] uppercase font-bold text-purple-600/70 tracking-widest">
                Clinician Portal
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5 font-sans">
            <Link
              href="/therapist/dashboard"
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-stone-600 hover:bg-stone-50 hover:text-stone-900 group"
            >
              <Users className="h-4.5 w-4.5 text-stone-400 group-hover:scale-110 transition-transform" />
              <span>Patient Directory</span>
            </Link>

            <Link
              href="/therapist/alerts"
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-stone-600 hover:bg-stone-50 hover:text-stone-900 group"
            >
              <Bell className="h-4.5 w-4.5 text-stone-400 group-hover:scale-110 transition-transform" />
              <span>Warning Alerts</span>
            </Link>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-stone-200/60 pt-6 space-y-4 font-sans">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 border border-stone-100 flex items-center justify-center font-bold text-purple-700">
              T
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">{name}</p>
              <p className="text-xs text-stone-400 truncate">{sessionUser.email}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 pl-80 min-h-screen flex flex-col">
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
