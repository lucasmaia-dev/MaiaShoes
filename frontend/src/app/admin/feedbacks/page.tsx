import Link from "next/link";
import styles from "../admin.module.css";
import FeedbackModeration from "./feedback-moderation";

export const metadata = {
  title: "Participações | Painel MaiaShoes",
  robots: { index: false, follow: false },
};

export default function FeedbackAdminPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/admin" className={styles.storeLink}>
          ← Produtos
        </Link>
        <Link href="/#comunidade" className={styles.storeLink}>
          Ver comunidade ↗
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>ESCUTAR TAMBÉM É CUIDAR</p>
          <h1>Avaliações e sugestões</h1>
          <p>
            Aprove relatos com autorização e leia as sugestões privadas. Nenhuma
            participação é publicada automaticamente.
          </p>
        </div>
        <FeedbackModeration />
      </main>
    </div>
  );
}
