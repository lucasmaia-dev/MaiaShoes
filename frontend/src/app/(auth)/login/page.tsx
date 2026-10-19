import Image from 'next/image';
import Link from 'next/link';
import AuthForm from '../auth-form';
import styles from '../auth.module.css';

export const metadata = { title: 'Entrar | MaiaShoes', robots: { index: false, follow: false } };
export default function LoginPage() {
  return <main className={styles.page}><section className={styles.card}>
    <Link className={styles.brand} href="/"><Image src="/logo-maia.jpg" width={64} height={64} alt="Maia shoes" />MAIA SHOES & BAGS</Link>
    <p className={styles.eyebrow}>BOM TER VOCÊ AQUI</p><h1>Entre na sua conta</h1><p className={styles.intro}>Use seu e-mail e senha para continuar. Administradores também podem entrar com seu usuário.</p>
    <AuthForm />
  </section></main>;
}
