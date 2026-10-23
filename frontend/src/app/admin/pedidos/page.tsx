import Link from "next/link";
import OrderModeration from "./order-moderation";
import styles from "../../checkout/checkout.module.css";

export const metadata = {
  title: "Pedidos Pix | Painel MaiaShoes",
  robots: { index: false, follow: false },
};
export default function AdminOrdersPage() {
  return (
    <main className={styles.main}>
      <Link href="/admin">← Painel administrativo</Link>
      <div className={styles.intro}>
        <h1>Pedidos & entregas</h1>
        <p>
          Os pedidos geram o Pix imediatamente. A entrega em casa custa R$ 15,00
          e já está incluída no total quando escolhida; a retirada é gratuita.
          Endereço e horário são combinados pelo WhatsApp. Confira o total
          recebido no extrato para confirmar o pagamento. Depois, atualize a
          preparação, a saída para entrega ou a retirada e conclua o pedido
          quando o cliente receber.
        </p>
      </div>
      <OrderModeration />
    </main>
  );
}
