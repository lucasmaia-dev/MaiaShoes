import type { ProductCategory } from "./product-categories";

// Grades confirmadas pela loja para todos os modelos de calçados.
// Acessórios não recebem numeração de calçado.
export const FOOTWEAR_LINES = [
  { value: "FEMININO", label: "Feminino", sizes: [34, 35, 36, 37, 38, 39] },
  {
    value: "MASCULINO",
    label: "Masculino",
    sizes: [37, 38, 39, 40, 41, 42, 43],
  },
] as const;
export type FootwearLine = (typeof FOOTWEAR_LINES)[number]["value"];

export function parseFootwearLine(value: string | null): FootwearLine | null {
  return FOOTWEAR_LINES.find((line) => line.value === value)?.value ?? null;
}

export function hasFootwearSizing(category: ProductCategory) {
  return (
    category === "TENIS" || category === "SAPATOS" || category === "SANDALIAS"
  );
}
