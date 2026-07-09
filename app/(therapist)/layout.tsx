import { getSessionUser } from '@/lib/auth/appwrite';
import { getUser } from '@/lib/db/dbHelper';
import ResponsiveLayout from '@/components/shared/ResponsiveLayout';
import { redirect } from 'next/navigation';

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
    <ResponsiveLayout userName={name} email={sessionUser.email} isTherapist={true}>
      {children}
    </ResponsiveLayout>
  );
}
