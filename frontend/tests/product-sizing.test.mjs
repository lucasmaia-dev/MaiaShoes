import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOOTWEAR_LINES,
  parseFootwearLine,
  hasFootwearSizing,
} from "../src/lib/product-sizing.ts";

test("a grade feminina inclui exatamente 34 a 39 e a masculina 37 a 43", () => {
  assert.deepEqual(
    FOOTWEAR_LINES.find((line) => line.value === "FEMININO").sizes,
    [34, 35, 36, 37, 38, 39],
  );
  assert.deepEqual(
    FOOTWEAR_LINES.find((line) => line.value === "MASCULINO").sizes,
    [37, 38, 39, 40, 41, 42, 43],
  );
});

test("apenas categorias de calçados recebem as grades confirmadas", () => {
  for (const category of ["TENIS", "SAPATOS", "SANDALIAS"])
    assert.equal(hasFootwearSizing(category), true);
  for (const category of ["BOLSAS", "SEM_CATEGORIA"])
    assert.equal(hasFootwearSizing(category), false);
});

test("links sem linha ou com valor inválido abrem toda a coleção", () => {
  assert.equal(parseFootwearLine(null), null);
  assert.equal(parseFootwearLine("invalid"), null);
  assert.equal(parseFootwearLine("FEMININO"), "FEMININO");
  assert.equal(parseFootwearLine("MASCULINO"), "MASCULINO");
});
