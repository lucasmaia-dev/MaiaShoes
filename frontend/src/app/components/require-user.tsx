import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/current-user';

export default async function RequireUser({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (admin && user.role !== 'ADMIN') redirect('/conta');
  return children;
}
