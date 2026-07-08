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
  HeartHandshake
} from 'lucide-react';
import { useTransition } from 'react';

interface SidebarProps {
  userName?: string;
  email?: string;
}

export default function Sidebar({ userName = 'Priya', email }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Check-in', href: '/checkin', icon: MessageSquareHeart, badge: 'Daily' },
    { name: 'Reflection Journal', href: '/journal', icon: BookOpen },
    { name: 'Assessments', href: '/assessments', icon: ClipboardList },
    { name: 'Settings & Sharing', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <aside className="w-80 h-screen bg-white/70 backdrop-blur-md border-r border-stone-200/60 p-6 flex flex-col justify-between font-sans fixed left-0 top-0 z-30">
      <div className="space-y-8">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-stone-800 leading-tight">MindMirror</h2>
            <span className="text-[10px] uppercase font-bold text-primary/70 tracking-widest">
              Continuous Care
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-stone-400'}`} />
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-100 to-purple-100 border border-stone-100 flex items-center justify-center font-bold text-primary">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
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
