import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ProductsPanel from './products-panel';
import styles from './admin.module.css';

export const metadata: Metadata = {
  title: 'Produtos | Painel MaiaShoes',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" aria-label="Voltar à loja MaiaShoes" className={styles.brand}>
          <Image src="/logo-maia.jpg" width={64} height={64} alt="Maia shoes" />
          <span>MAIA SHOES <small>PAINEL ADMINISTRATIVO</small></span>
        </Link>
        <Link href="/" className={styles.storeLink}>Ver loja ↗</Link>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>SEU CATÁLOGO, DO SEU JEITO</p>
          <h1>Produtos</h1>
          <p>Cadastre os detalhes de cada peça e acompanhe seus produtos em um só lugar.</p>
        </div>
        <p className={styles.localNotice}>Versão local de estudo · O acesso de administrador com login será adicionado em uma próxima etapa.</p>
        <ProductsPanel />
      </main>
      <footer className={styles.footer}>MAIA SHOES & BAGS <span>Cuidar dos detalhes faz parte.</span></footer>
    </div>
  );
}
