import type { Order } from "@/lib/orders-api";
import { fulfillmentLabel } from "@/lib/order-progress";
import styles from "./order-tracking.module.css";

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
export default function OrderTracking({ order }: { order: Order }) {
  const paid = order.status === "PAGO";
  const status = paid
    ? (order.fulfillmentStatus ?? "PREPARANDO")
    : "AGUARDANDO_PAGAMENTO";
  const middle =
    order.fulfillment === "ENTREGA"
      ? "SAIU_PARA_ENTREGA"
      : order.fulfillment === "RETIRADA"
        ? "PRONTO_PARA_RETIRADA"
        : null;
  const stages = [
    { key: "CRIADO", title: "Pedido recebido", at: order.createdAt },
    { key: "PAGAMENTO", title: "Pagamento confirmado", at: order.paidAt },
    { key: "PREPARANDO", title: "Em preparação", at: order.paidAt },
    ...(middle
      ? [
          {
            key: middle,
            title:
              middle === "SAIU_PARA_ENTREGA"
                ? "Saiu para entrega"
                : "Pronto para retirada",
            at: order.progressEvents?.find((event) => event.status === middle)
              ?.createdAt,
          },
        ]
      : []),
    {
      key: "CONCLUIDO",
      title:
        order.fulfillment === "ENTREGA"
          ? "Entregue"
          : order.fulfillment === "RETIRADA"
            ? "Retirado"
            : "Concluído",
      at: order.progressEvents?.find((event) => event.status === "CONCLUIDO")
        ?.createdAt,
    },
  ];
  const current = paid ? stages.findIndex((stage) => stage.key === status) : 0;
  return (
    <section className={styles.tracking} aria-label="Acompanhamento do pedido">
      <p className={styles.caption}>ACOMPANHE SUA COMPRA</p>
      <h2>{fulfillmentLabel(order)}</h2>
      <ol className={styles.steps}>
        {stages.map((stage, index) => (
          <li
            key={stage.key}
            data-done={index <= current}
            aria-current={index === current ? "step" : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {index <= current ? "✓" : index + 1}
            </span>
            <div>
              <strong>{stage.title}</strong>
              {stage.at && (
                <time dateTime={stage.at}>
                  {date.format(new Date(stage.at))}
                </time>
              )}
              {index === current && <small>Etapa atual</small>}
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.hint}>
        {status === "CONCLUIDO"
          ? "Pedido concluído pela Maia. Obrigado por escolher suas peças com a gente."
          : paid
            ? "A Maia atualiza as etapas por aqui. Endereço e horário continuam combinados pelo WhatsApp."
            : "Assim que a Maia conferir o Pix na conta, seu pedido entra em preparação."}
      </p>
    </section>
  );
}
