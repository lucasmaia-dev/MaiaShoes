import StoreHeader from "../components/store-header";
import Cart from "./cart";
import styles from "../checkout/checkout.module.css";
export const metadata = {
  title: "Meu carrinho | MaiaShoes",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  return (
    <div className="storefront">
      <StoreHeader collectionPage />
      <main className={styles.main}>
        <Cart />
      </main>
    </div>
  );
}
