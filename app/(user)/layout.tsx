import { getSessionUser } from '@/lib/auth/appwrite';
import { getUser } from '@/lib/db/dbHelper';
import ResponsiveLayout from '@/components/shared/ResponsiveLayout';
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
    <ResponsiveLayout userName={name} email={sessionUser.email} isTherapist={false}>
      {children}
    </ResponsiveLayout>
  );
}
