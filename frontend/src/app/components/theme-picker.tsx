"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-config";

type Theme = "light" | "dark";
const themeEvent = "maia:theme-changed";
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";
const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    document.documentElement.dataset.theme =
      event.newValue === "light" || event.newValue === "dark"
        ? event.newValue
        : systemTheme();
    callback();
  };
  const onSystemChange = () => {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    } catch {}
    document.documentElement.dataset.theme = systemTheme();
    callback();
  };
  window.addEventListener(themeEvent, callback);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(themeEvent, callback);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystemChange);
  };
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {theme === "light" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </>
      ) : (
        <path d="M20.5 14.3A9 9 0 0 1 9.7 3.5a9 9 0 1 0 10.8 10.8Z" />
      )}
    </svg>
  );
}

export default function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, getTheme, (): Theme => "light");
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        menu.current &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const choose = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* A escolha continua funcionando nesta página. */
    }
    window.dispatchEvent(new Event(themeEvent));
    if (menu.current) {
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
  };
  return (
    <details
      className="theme-menu"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Escolher tema" title="Escolher tema">
        <ThemeIcon theme={theme} />
      </summary>
      <div
        className="theme-options"
        role="group"
        aria-label="Aparência da loja"
      >
        <span>Aparência</span>
        <button
          type="button"
          aria-label="Modo claro"
          aria-pressed={theme === "light"}
          onClick={() => choose("light")}
        >
          <ThemeIcon theme="light" />
          Claro<span aria-hidden="true">{theme === "light" ? "✓" : ""}</span>
        </button>
        <button
          type="button"
          aria-label="Modo escuro"
          aria-pressed={theme === "dark"}
          onClick={() => choose("dark")}
        >
          <ThemeIcon theme="dark" />
          Escuro<span aria-hidden="true">{theme === "dark" ? "✓" : ""}</span>
        </button>
      </div>
    </details>
  );
}
