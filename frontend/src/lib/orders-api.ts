export type OrderItem = {
  productId: number;
  productName: string;
  imageUrl: string | null;
  line: string | null;
  size: number | null;
  quantity: number;
  unitPriceCents: number;
};
export type FulfillmentStatus =
  | "AGUARDANDO_PAGAMENTO"
  | "PREPARANDO"
  | "SAIU_PARA_ENTREGA"
  | "PRONTO_PARA_RETIRADA"
  | "CONCLUIDO";
export type Order = {
  id: string;
  productId: number;
  productName: string;
  imageUrl: string | null;
  line: string | null;
  size: number | null;
  quantity: number;
  unitPriceCents: number;
  subtotalCents?: number | null;
  items?: OrderItem[];
  shippingCents: number | null;
  totalCents: number | null;
  contact: string;
  fulfillment: "RETIRADA" | "ENTREGA" | "A_COMBINAR";
  fulfillmentViaWhatsapp: boolean;
  deliveryFeeCents: number | null;
  whatsappNumber?: string | null;
  address: string | null;
  status: "AGUARDANDO_CONFIRMACAO" | "AGUARDANDO_PAGAMENTO" | "PAGO";
  fulfillmentStatus?: FulfillmentStatus;
  progressEvents?: { status: FulfillmentStatus; createdAt: string }[];
  pixPayload: string | null;
  pixReceiver: string | null;
  qrCode?: string | null;
  createdAt: string;
  paidAt: string | null;
  user?: { name: string; email: string | null };
};

export function orderItems(order: Order): OrderItem[] {
  return order.items?.length
    ? order.items
    : [
        {
          productId: order.productId,
          productName: order.productName,
          imageUrl: order.imageUrl,
          line: order.line,
          size: order.size,
          quantity: order.quantity,
          unitPriceCents: order.unitPriceCents,
        },
      ];
}
export function orderSubtotal(order: Order) {
  return (
    order.subtotalCents ??
    orderItems(order).reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    )
  );
}

export const orderStatus = {
  AGUARDANDO_CONFIRMACAO: "Escolha como receber para gerar o Pix",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento Pix",
  PAGO: "Pagamento confirmado",
};
export class OrdersApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function ordersRequest<T>(
  path = "",
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/orders${path}`, {
    ...options,
    cache: "no-store",
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "X-MaiaShoes-Request": "1",
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new OrdersApiError(
        "Entre na sua conta para continuar com o pedido.",
        response.status,
      );
    const error = await response.json().catch(() => null);
    throw new OrdersApiError(
      Array.isArray(error?.message)
        ? error.message.join(" ")
        : (error?.message ?? "Não foi possível concluir. Tente novamente."),
      response.status,
    );
  }
  return response.json();
}
