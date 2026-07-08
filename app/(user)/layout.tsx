import { getSessionUser } from '@/lib/auth/supabase';
import { getUser } from '@/lib/db/dbHelper';
import Sidebar from '@/components/shared/Sidebar';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  
  if (!sessionUser) {
    redirect('/login');
  }

  const profile = await getUser(sessionUser.id);
  const name = profile?.name || 'User';

  return (
    <div className="min-h-screen bg-stone-50/50 flex">
      {/* Fixed Sidebar */}
      <Sidebar userName={name} email={sessionUser.email} />

      {/* Main Content Area */}
      <div className="flex-1 pl-80 min-h-screen flex flex-col">
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
