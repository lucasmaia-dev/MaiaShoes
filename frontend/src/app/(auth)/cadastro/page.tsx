import Image from 'next/image';
import Link from 'next/link';
import AuthForm from '../auth-form';
import styles from '../auth.module.css';

export const metadata = { title: 'Criar conta | MaiaShoes', robots: { index: false, follow: false } };
export default function RegisterPage() {
  return <main className={styles.page}><section className={styles.card}>
    <Link className={styles.brand} href="/"><Image src="/logo-maia.jpg" width={64} height={64} alt="Maia shoes" />MAIA SHOES & BAGS</Link>
    <p className={styles.eyebrow}>SEU ESPAÇO NA MAIA</p><h1>Crie sua conta</h1><p className={styles.intro}>Preencha seus dados para criar sua conta de cliente.</p>
    <AuthForm register />
  </section></main>;
}
