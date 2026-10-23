import assert from "node:assert/strict";
import test from "node:test";
import { orderWhatsappUrl } from "../src/lib/order-whatsapp.ts";
const order = {
  id: "pedido123",
  productName: "Tênis & Bolsa / edição especial",
  quantity: 2,
  size: 36,
  line: "FEMININO",
  totalCents: 40002,
  shippingCents: 0,
  fulfillmentViaWhatsapp: false,
  deliveryFeeCents: 1500,
  status: "AGUARDANDO_PAGAMENTO",
};
const phone = "5562999999999";
test("pedido concluído oferece atendimento sem voltar a combinar recebimento", () => {
  const message = new URL(
    orderWhatsappUrl(
      phone,
      { ...order, status: "PAGO", fulfillmentStatus: "CONCLUIDO" },
      "RETIRADA",
    ),
  ).searchParams.get("text");
  assert.ok(message.includes("pedido concluído"));
  assert.ok(!message.includes("combinar o recebimento"));
  assert.ok(!message.includes("combinar o endereço"));
});
test("mensagem inclui todas as peças e os tamanhos do carrinho", () => {
  const message = new URL(
    orderWhatsappUrl(
      phone,
      {
        ...order,
        items: [
          {
            productName: "Tênis azul",
            quantity: 2,
            line: "FEMININO",
            size: 36,
          },
          { productName: "Bolsa preta", quantity: 1, line: null, size: null },
        ],
      },
      "RETIRADA",
    ),
  ).searchParams.get("text");
  assert.ok(message.includes("Tênis azul"));
  assert.ok(message.includes("Bolsa preta"));
  assert.ok(message.includes("Quantidade: 2"));
  assert.ok(message.includes("Numeração: 36"));
});
test("prepara retirada com pedido e tamanho sem afirmar que o Pix foi conferido", () => {
  const url = new URL(orderWhatsappUrl(phone, order, "RETIRADA"));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, `/${phone}`);
  const message = url.searchParams.get("text");
  assert.ok(message.includes(order.productName));
  assert.ok(message.includes(order.id));
  assert.ok(message.includes("Numeração: 36"));
  assert.ok(message.includes("retirada gratuita"));
  assert.ok(message.includes("aguardo a conferência"));
  assert.ok(!message.includes("confirmado pela Maia"));
});
test("entrega informa R$ 15 incluídos no mesmo Pix", () => {
  const message = new URL(
    orderWhatsappUrl(
      phone,
      { ...order, status: "PAGO", shippingCents: 1500, totalCents: 41502 },
      "ENTREGA",
    ),
  ).searchParams.get("text");
  assert.match(message, /15,00/);
  assert.match(message, /415,02/);
  assert.ok(message.includes("já está incluída no total do Pix"));
  assert.ok(!message.includes("paga separadamente"));
  assert.ok(message.includes("Pagamento confirmado pela Maia."));
});
test("não produz link sem telefone, total ou Pix liberado", () => {
  assert.equal(orderWhatsappUrl(null, order, "RETIRADA"), null);
  assert.equal(
    orderWhatsappUrl("javascript:alert(1)", order, "RETIRADA"),
    null,
  );
  assert.equal(
    orderWhatsappUrl(phone, { ...order, totalCents: null }, "RETIRADA"),
    null,
  );
  assert.equal(
    orderWhatsappUrl(
      phone,
      { ...order, status: "AGUARDANDO_CONFIRMACAO" },
      "RETIRADA",
    ),
    null,
  );
});
