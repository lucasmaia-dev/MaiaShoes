"use client";

import { useSyncExternalStore } from "react";

const storageKey = "maia:favorites:v1";
const changeEvent = "maia:favorites-changed";
let memorySnapshot = "[]";
let memoryOnly = false;

function getSnapshot() {
  if (memoryOnly) return memorySnapshot;
  try {
    return localStorage.getItem(storageKey) ?? memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function parseIds(snapshot: string): number[] {
  try {
    const value: unknown = JSON.parse(snapshot);
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is number => Number.isSafeInteger(id) && id > 0,
            ),
          ),
        ]
      : [];
  } catch {
    return [];
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

export function useFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const ids = parseIds(snapshot);
  const toggle = (id: number) => {
    const current = parseIds(getSnapshot());
    memorySnapshot = JSON.stringify(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    try {
      localStorage.setItem(storageKey, memorySnapshot);
    } catch {
      memoryOnly = true;
      /* Mantém a seleção em memória quando o navegador bloqueia armazenamento. */
    }
    window.dispatchEvent(new Event(changeEvent));
  };
  return { ids, toggle };
}
