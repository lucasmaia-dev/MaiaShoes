import StoreHeader from "../components/store-header";
import Orders from "./orders";
import styles from "../checkout/checkout.module.css";

export const metadata = {
  title: "Meus pedidos | MaiaShoes",
  robots: { index: false, follow: false },
};
export default function OrdersPage() {
  return (
    <div className="storefront">
      <StoreHeader collectionPage />
      <main className={styles.main}>
        <Orders />
      </main>
    </div>
  );
}
