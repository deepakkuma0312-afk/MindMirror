'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { 
  LayoutDashboard, 
  MessageSquareHeart, 
  BookOpen, 
  ClipboardList, 
  Settings, 
  LogOut, 
  HeartHandshake,
  Users,
  Bell,
  Activity,
  X
} from 'lucide-react';
import { useTransition } from 'react';

interface SidebarProps {
  userName?: string;
  email?: string;
  isTherapist?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

export default function Sidebar({ userName = 'User', email, isTherapist = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const patientMenu: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Check-in', href: '/checkin', icon: MessageSquareHeart, badge: 'Daily' },
    { name: 'Reflection Journal', href: '/journal', icon: BookOpen },
    { name: 'Assessments', href: '/assessments', icon: ClipboardList },
    { name: 'Settings & Sharing', href: '/settings', icon: Settings },
  ];

  const therapistMenu: MenuItem[] = [
    { name: 'Patient Directory', href: '/therapist/dashboard', icon: Users },
    { name: 'Warning Alerts', href: '/therapist/alerts', icon: Bell },
  ];

  const menuItems = isTherapist ? therapistMenu : patientMenu;

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <aside className="w-full h-full bg-white/80 backdrop-blur-md border-r border-stone-200/60 p-6 flex flex-col justify-between font-sans">
      <div className="space-y-8">
        {/* Brand & Mobile Close button */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {isTherapist ? (
              <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
                <Activity className="h-5 w-5" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                <HeartHandshake className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-serif text-stone-800 leading-tight font-semibold">
                {isTherapist ? 'MirrorCare' : 'MindMirror'}
              </h2>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${
                isTherapist ? 'text-purple-600/70' : 'text-primary/70'
              }`}>
                {isTherapist ? 'Clinician Portal' : 'Continuous Care'}
              </span>
            </div>
          </div>
          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isItemActive = pathname === item.href || (isTherapist && pathname.startsWith(item.href) && item.href !== '/therapist/dashboard' && item.href === '/therapist/dashboard');
            const isActive = isItemActive || (pathname.startsWith(item.href) && item.href !== '/therapist/dashboard' && item.href !== '/dashboard');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? isTherapist 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                      : 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-stone-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="border-t border-stone-200/60 pt-6 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className={`h-10 w-10 rounded-full border border-stone-100 flex items-center justify-center font-bold ${
            isTherapist 
              ? 'bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-700'
              : 'bg-gradient-to-tr from-emerald-100 to-purple-100 text-primary'
          }`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-800 truncate">{userName}</p>
            <p className="text-xs text-stone-400 truncate">{email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>{isPending ? 'Signing Out...' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}
