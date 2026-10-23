export type CartItem = {
  productId: number;
  quantity: number;
  line?: "FEMININO" | "MASCULINO";
  size?: number;
};
export const MAX_CART_ITEMS = 20;
export function cartKey(item: CartItem) {
  return [item.productId, item.line ?? "", item.size ?? ""].join(":");
}
export function validCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CartItem;
  if (
    !Number.isSafeInteger(item.productId) ||
    item.productId < 1 ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 10
  )
    return false;
  if (item.line === undefined && item.size === undefined) return true;
  const sizes =
    item.line === "FEMININO"
      ? [34, 35, 36, 37, 38, 39]
      : item.line === "MASCULINO"
        ? [37, 38, 39, 40, 41, 42, 43]
        : [];
  return sizes.includes(item.size!);
}
export function parseCart(raw: string): CartItem[] {
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    const unique = new Map<string, CartItem>();
    for (const item of values)
      if (
        validCartItem(item) &&
        !unique.has(cartKey(item)) &&
        unique.size < MAX_CART_ITEMS
      ) {
        unique.set(cartKey(item), {
          productId: item.productId,
          quantity: item.quantity,
          ...(item.line ? { line: item.line, size: item.size } : {}),
        });
      }
    return [...unique.values()];
  } catch {
    return [];
  }
}
export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  if (!validCartItem(item))
    throw new Error("Escolha uma numeração e quantidade válidas.");
  const existing = items.find((current) => cartKey(current) === cartKey(item));
  if (existing && existing.quantity + item.quantity > 10)
    throw new Error("Você pode adicionar até 10 unidades de cada opção.");
  if (!existing && items.length >= MAX_CART_ITEMS)
    throw new Error("Seu carrinho pode conter até 20 opções de produto.");
  return existing
    ? items.map((current) =>
        cartKey(current) === cartKey(item)
          ? { ...current, quantity: current.quantity + item.quantity }
          : current,
      )
    : [...items, item];
}
export function removePurchased(
  items: CartItem[],
  purchased: CartItem[],
): CartItem[] {
  return items.flatMap((item) => {
    const paid = purchased.find((entry) => cartKey(entry) === cartKey(item));
    const quantity = item.quantity - (paid?.quantity ?? 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}

export function finalizeCartItems(
  items: CartItem[],
  footwearIds: number[],
  selections: Record<string, Pick<CartItem, "line" | "size">>,
): CartItem[] {
  return items.reduce<CartItem[]>((result, item) => {
    if (!footwearIds.includes(item.productId))
      return addCartItem(result, {
        productId: item.productId,
        quantity: item.quantity,
      });
    const selection = selections[cartKey(item)] ?? item;
    const selected = {
      productId: item.productId,
      quantity: item.quantity,
      line: selection.line,
      size: selection.size,
    };
    if (!selected.line || !selected.size || !validCartItem(selected))
      throw new Error(
        "Selecione a numeração de todos os calçados antes de pagar.",
      );
    return addCartItem(result, selected);
  }, []);
}
