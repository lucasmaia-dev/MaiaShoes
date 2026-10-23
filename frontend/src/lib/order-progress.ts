import type { Order, FulfillmentStatus } from "./orders-api";
type TrackedOrder = Pick<Order, "status" | "fulfillment" | "fulfillmentStatus">;
export function fulfillmentLabel(order: TrackedOrder) {
  if (order.status !== "PAGO") return "Aguardando pagamento";
  const status = order.fulfillmentStatus ?? "PREPARANDO";
  if (status === "CONCLUIDO")
    return order.fulfillment === "ENTREGA"
      ? "Entregue"
      : order.fulfillment === "RETIRADA"
        ? "Retirado"
        : "Pedido concluído";
  if (status === "SAIU_PARA_ENTREGA") return "Saiu para entrega";
  if (status === "PRONTO_PARA_RETIRADA") return "Pronto para retirada";
  return "Em preparação";
}
export function nextOrderProgress(
  order: TrackedOrder,
): { status: FulfillmentStatus; label: string } | null {
  if (order.status !== "PAGO") return null;
  const status = order.fulfillmentStatus ?? "PREPARANDO";
  if (status === "PREPARANDO") {
    if (order.fulfillment === "ENTREGA")
      return {
        status: "SAIU_PARA_ENTREGA",
        label: "Marcar saída para entrega",
      };
    if (order.fulfillment === "RETIRADA")
      return {
        status: "PRONTO_PARA_RETIRADA",
        label: "Marcar pronto para retirada",
      };
    return { status: "CONCLUIDO", label: "Concluir recebimento combinado" };
  }
  if (status === "SAIU_PARA_ENTREGA")
    return { status: "CONCLUIDO", label: "Confirmar entrega realizada" };
  if (status === "PRONTO_PARA_RETIRADA")
    return { status: "CONCLUIDO", label: "Confirmar retirada realizada" };
  return null;
}
