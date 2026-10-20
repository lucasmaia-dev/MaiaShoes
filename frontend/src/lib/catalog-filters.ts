import type { Product } from "./products-api";

export const CATALOG_BRANDS = [
  "Todas",
  "Adidas",
  "Nike",
  "New Balance",
  "Vans",
  "Mizuno",
] as const;
export const PRICE_LIMITS = [null, 160, 180, 200] as const;
export type CatalogBrand = (typeof CATALOG_BRANDS)[number];
export type CatalogFilters = {
  brand: CatalogBrand;
  maxPrice: number | null;
  sort: string;
};

export const DEFAULT_FILTERS: CatalogFilters = {
  brand: "Todas",
  maxPrice: null,
  sort: "selection",
};
export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

export function matchesBrand(product: Product, brand: CatalogBrand) {
  if (brand === "Todas") return true;
  const name = normalize(product.name);
  return brand === "Adidas"
    ? /adidas|samba|campus|gazelle/.test(name)
    : name.includes(normalize(brand));
}

export function matchesFilters(product: Product, filters: CatalogFilters) {
  return (
    matchesBrand(product, filters.brand) &&
    (filters.maxPrice === null || Number(product.price) <= filters.maxPrice)
  );
}
