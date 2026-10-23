import { Suspense } from "react";
import StoreHeader from "../../components/store-header";
import Orders from "../orders";
import styles from "../../checkout/checkout.module.css";

export const metadata = {
  title: "Seu pedido Pix | MaiaShoes",
  robots: { index: false, follow: false },
};
async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Orders id={id} />;
}
export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="storefront">
      <StoreHeader collectionPage />
      <main className={styles.main}>
        <Suspense fallback={<p role="status">Carregando pedido…</p>}>
          <Detail params={params} />
        </Suspense>
      </main>
    </div>
  );
}
