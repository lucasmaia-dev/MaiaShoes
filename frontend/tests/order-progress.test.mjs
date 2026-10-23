import test from "node:test";
import assert from "node:assert/strict";
import {
  fulfillmentLabel,
  nextOrderProgress,
} from "../src/lib/order-progress.ts";
const paid = {
  status: "PAGO",
  fulfillment: "ENTREGA",
  fulfillmentStatus: "PREPARANDO",
};
test("não oferece preparação ou entrega antes do pagamento", () => {
  const order = { ...paid, status: "AGUARDANDO_PAGAMENTO" };
  assert.equal(nextOrderProgress(order), null);
  assert.equal(fulfillmentLabel(order), "Aguardando pagamento");
});
test("entrega e retirada seguem etapas próprias e terminam sem novas ações", () => {
  assert.equal(nextOrderProgress(paid).status, "SAIU_PARA_ENTREGA");
  assert.equal(
    nextOrderProgress({ ...paid, fulfillment: "RETIRADA" }).status,
    "PRONTO_PARA_RETIRADA",
  );
  assert.equal(
    nextOrderProgress({ ...paid, fulfillmentStatus: "SAIU_PARA_ENTREGA" })
      .status,
    "CONCLUIDO",
  );
  assert.equal(
    nextOrderProgress({ ...paid, fulfillmentStatus: "CONCLUIDO" }),
    null,
  );
  assert.equal(
    fulfillmentLabel({ ...paid, fulfillmentStatus: "CONCLUIDO" }),
    "Entregue",
  );
  assert.equal(
    fulfillmentLabel({
      ...paid,
      fulfillment: "RETIRADA",
      fulfillmentStatus: "CONCLUIDO",
    }),
    "Retirado",
  );
});
test("pedidos antigos com recebimento combinado não ficam bloqueados na preparação", () => {
  assert.equal(
    nextOrderProgress({ ...paid, fulfillment: "A_COMBINAR" }).status,
    "CONCLUIDO",
  );
  assert.equal(
    fulfillmentLabel({
      ...paid,
      fulfillment: "A_COMBINAR",
      fulfillmentStatus: "CONCLUIDO",
    }),
    "Pedido concluído",
  );
});
