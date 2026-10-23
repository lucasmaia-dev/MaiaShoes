import { Suspense } from "react";
import StoreHeader from "../components/store-header";
import Checkout from "./checkout";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Comprar com Pix | MaiaShoes",
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return (
    <div className="storefront">
      <StoreHeader collectionPage />
      <main className={styles.main}>
        <Suspense fallback={<p role="status">Carregando seu pedido…</p>}>
          <Checkout />
        </Suspense>
      </main>
    </div>
  );
}
