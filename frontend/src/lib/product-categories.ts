export const PRODUCT_CATEGORIES = [
  { value: 'TENIS', label: 'Tênis' },
  { value: 'BOLSAS', label: 'Bolsas' },
  { value: 'SEM_CATEGORIA', label: 'Sem categoria' },
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]['value'];

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((category) => category.value === value);
}

export function categoryLabel(value: ProductCategory) {
  return PRODUCT_CATEGORIES.find((category) => category.value === value)?.label ?? 'Sem categoria';
}
