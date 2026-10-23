import type { Order } from "./orders-api";

export type ReceiptChoice = "RETIRADA" | "ENTREGA";
type WhatsappOrder = Pick<
  Order,
  | "id"
  | "productName"
  | "quantity"
  | "size"
  | "line"
  | "status"
  | "totalCents"
  | "deliveryFeeCents"
  | "shippingCents"
  | "fulfillmentViaWhatsapp"
  | "items"
  | "fulfillmentStatus"
>;

export function orderWhatsappUrl(
  phone: string | null | undefined,
  order: WhatsappOrder,
  choice: ReceiptChoice,
) {
  if (
    !phone ||
    !/^55[1-9]\d{9,10}$/.test(phone) ||
    order.totalCents === null ||
    !["PAGO", "AGUARDANDO_PAGAMENTO"].includes(order.status) ||
    !["RETIRADA", "ENTREGA"].includes(choice)
  )
    return null;
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const message = [
    order.fulfillmentStatus === "CONCLUIDO"
      ? "Olá, Maia! Quero atendimento sobre meu pedido concluído."
      : "Olá, Maia! Quero combinar o recebimento do meu pedido.",
    `Pedido: ${order.id}`,
    ...(order.items?.length ? order.items : [order]).flatMap((item) => [
      `Produto: ${item.productName}`,
      `Quantidade: ${item.quantity}`,
      ...(item.size
        ? [
            `Numeração: ${item.size} · ${item.line === "FEMININO" ? "Feminino" : "Masculino"}`,
          ]
        : []),
    ]),
    `Total do Pix: ${money.format(order.totalCents / 100)}`,
    order.status === "PAGO"
      ? "Pagamento confirmado pela Maia."
      : "Já fiz o Pix; aguardo a conferência da Maia.",
    order.fulfillmentStatus === "CONCLUIDO"
      ? "Meu pedido já foi recebido. Quero falar sobre esta compra."
      : choice === "RETIRADA"
        ? "Escolhi retirada gratuita. Podemos combinar o endereço e o horário?"
        : order.fulfillmentViaWhatsapp
          ? `Este pedido foi emitido no fluxo anterior, com entrega de ${money.format((order.deliveryFeeCents ?? 1500) / 100)} separada. Quero combinar a entrega com a Maia.`
          : `Escolhi entrega em casa. A taxa de ${money.format((order.shippingCents ?? 0) / 100)} já está incluída no total do Pix. Podemos combinar o endereço e o horário?`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
