"use client";
import { useSyncExternalStore } from "react";
import {
  addCartItem,
  cartKey,
  parseCart,
  removePurchased,
  type CartItem,
} from "./cart-data";
const storageKey = "maia:cart:v1";
const changeEvent = "maia:cart-changed";
let memorySnapshot = "[]";
let memoryOnly = false;
function snapshot() {
  try {
    return memoryOnly
      ? memorySnapshot
      : (localStorage.getItem(storageKey) ?? "[]");
  } catch {
    return memorySnapshot;
  }
}
function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, callback);
  };
}
function save(items: CartItem[]) {
  memorySnapshot = JSON.stringify(items);
  try {
    localStorage.setItem(storageKey, memorySnapshot);
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(changeEvent));
}
export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const items = parseCart(raw);
  return {
    items,
    ready,
    count: items.reduce((total, item) => total + item.quantity, 0),
    add: (item: CartItem) => save(addCartItem(parseCart(snapshot()), item)),
    remove: (key: string) =>
      save(parseCart(snapshot()).filter((item) => cartKey(item) !== key)),
    update: (key: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
        throw new Error("Escolha de 1 a 10 unidades.");
      save(
        parseCart(snapshot()).map((item) =>
          cartKey(item) === key ? { ...item, quantity } : item,
        ),
      );
    },
    purchased: (purchased: CartItem[]) =>
      save(removePurchased(parseCart(snapshot()), purchased)),
  };
}
