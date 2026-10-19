import { Suspense } from 'react';
import RequireUser from '../components/require-user';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="catalog-message" role="status">Verificando seu acesso…</p>}><RequireUser admin>{children}</RequireUser></Suspense>;
}
