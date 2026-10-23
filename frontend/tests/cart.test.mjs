import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  cartKey,
  parseCart,
  removePurchased,
  finalizeCartItems,
} from "../src/lib/cart-data.ts";

const shoe = { productId: 1, quantity: 1, line: "FEMININO", size: 36 };
test("permite adicionar e restaurar calçado sem numeração no carrinho", () => {
  const item = { productId: 1, quantity: 2 };
  assert.deepEqual(parseCart(JSON.stringify(addCartItem([], item))), [item]);
});
test("exige numeração válida somente ao preparar o pagamento", () => {
  const item = { productId: 1, quantity: 2 };
  assert.throws(() => finalizeCartItems([item], [1], {}), /numeração/);
  assert.throws(
    () =>
      finalizeCartItems([item], [1], {
        [cartKey(item)]: { line: "MASCULINO", size: 34 },
      }),
    /numeração/,
  );
  assert.deepEqual(
    finalizeCartItems([item, { productId: 2, quantity: 1 }], [1], {
      [cartKey(item)]: { line: "MASCULINO", size: 40 },
    }),
    [
      { productId: 1, quantity: 2, line: "MASCULINO", size: 40 },
      { productId: 2, quantity: 1 },
    ],
  );
});
test("preserva tamanhos salvos e agrupa escolhas iguais na finalização", () => {
  const pending = { productId: 1, quantity: 2 };
  assert.deepEqual(finalizeCartItems([shoe], [1], {}), [shoe]);
  assert.deepEqual(
    finalizeCartItems([shoe, pending], [1], {
      [cartKey(pending)]: { line: "FEMININO", size: 36 },
    }),
    [{ ...shoe, quantity: 3 }],
  );
  assert.throws(
    () =>
      finalizeCartItems([{ ...shoe, quantity: 9 }, pending], [1], {
        [cartKey(pending)]: { line: "FEMININO", size: 36 },
      }),
    /10 unidades/,
  );
});
test("agrupa peças iguais e mantém numerações e linhas separadas", () => {
  let cart = addCartItem([], shoe);
  cart = addCartItem(cart, { ...shoe, quantity: 2 });
  cart = addCartItem(cart, { ...shoe, size: 37 });
  cart = addCartItem(cart, { ...shoe, size: 37, line: "MASCULINO" });
  assert.equal(cart.length, 3);
  assert.equal(cart[0].quantity, 3);
  assert.notEqual(cartKey(cart[1]), cartKey(cart[2]));
});
test("limita quantidades e número de opções sem descartar a seleção anterior", () => {
  const cart = [{ ...shoe, quantity: 10 }];
  assert.throws(() => addCartItem(cart, shoe));
  assert.equal(cart[0].quantity, 10);
  const full = Array.from({ length: 20 }, (_, i) => ({
    productId: i + 1,
    quantity: 1,
  }));
  assert.throws(() => addCartItem(full, { productId: 21, quantity: 1 }));
});
test("restaura somente dados válidos do navegador e ignora preços injetados", () => {
  const cart = parseCart(
    JSON.stringify([
      { ...shoe, price: 1 },
      { ...shoe, quantity: 0 },
      { ...shoe, productId: 2, line: "MASCULINO", size: 34 },
      { productId: 3, quantity: 2 },
    ]),
  );
  assert.deepEqual(cart, [shoe, { productId: 3, quantity: 2 }]);
  assert.deepEqual(parseCart("{invalido"), []);
});
test("finalização remove só as unidades pedidas e preserva adições de outra aba", () => {
  const latest = [
    { ...shoe, quantity: 4 },
    { productId: 3, quantity: 1 },
  ];
  assert.deepEqual(removePurchased(latest, [{ ...shoe, quantity: 2 }]), [
    { ...shoe, quantity: 2 },
    { productId: 3, quantity: 1 },
  ]);
});
