import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/current-user';
import LogoutButton from '../../components/logout-button';
import styles from '../auth.module.css';

export const metadata = { title: 'Minha conta | MaiaShoes', robots: { index: false, follow: false } };

async function Account() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <section className={styles.card}>
    <p className={styles.eyebrow}>MINHA CONTA</p><h1>Olá, {user.name}.</h1>
    <p className={styles.intro}>Você está conectado à MaiaShoes.</p>
    <div className={styles.details}><p>Usuário: <strong>{user.username}</strong></p><p>Perfil: <strong>{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</strong></p></div>
    <div className={styles.links}><Link href="/">Ver coleção ↗</Link>{user.role === 'ADMIN' && <Link href="/admin">Abrir painel</Link>}<LogoutButton /></div>
  </section>;
}

export default function AccountPage() {
  return <main className={styles.page}><Suspense fallback={<p role="status">Verificando sua conta…</p>}><Account /></Suspense></main>;
}
