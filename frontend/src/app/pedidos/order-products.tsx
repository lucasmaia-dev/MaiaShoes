import Image from "next/image";
import { orderItems, type Order } from "@/lib/orders-api";
import { currency } from "@/lib/catalog-filters";
import styles from "../checkout/checkout.module.css";
export default function OrderProducts({ order }: { order: Order }) {
  return (
    <div aria-label="Produtos do pedido">
      {orderItems(order).map((item, index) => (
        <div className={styles.product} key={index}>
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.productName}
              width={90}
              height={110}
            />
          )}
          <div>
            <h2>{item.productName}</h2>
            <p>
              {item.quantity} unidade(s)
              {item.size
                ? ` · ${item.line === "FEMININO" ? "Feminino" : "Masculino"} · tamanho ${item.size}`
                : ""}
            </p>
            <p>
              {currency.format((item.unitPriceCents * item.quantity) / 100)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
