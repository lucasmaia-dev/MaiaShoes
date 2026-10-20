"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useFavorites } from "@/lib/favorites";

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M20.6 4.9a5.5 5.5 0 0 0-7.8 0L12 5.7l-.8-.8a5.5 5.5 0 0 0-7.8 7.8L12 21l8.6-8.3a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default function StoreHeader() {
  const { ids } = useFavorites();
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <header className="header-shell">
      <div className="header container">
        <Link href="/" className="brand" aria-label="Maia shoes — início">
          <Image src="/logo-maia.jpg" width={46} height={46} alt="" />
          <span>
            maia<span>SHOES & BAGS</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Menu principal">
          <Link href="/?categoria=TENIS#colecao">Explorar coleção</Link>
          <a href="#categorias">Categorias</a>
          <a href="#sobre">Universo Maia</a>
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button saved-link"
            href="/?favoritos=1#colecao"
            aria-label={`Ver favoritos (${ids.length})`}
          >
            <HeartIcon />
            {ids.length > 0 && (
              <span className="favorite-count">{ids.length}</span>
            )}
          </Link>
          <Link className="account-link" href="/conta" aria-label="Minha conta">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
            <span>Minha conta</span>
          </Link>
          <details
            className="mobile-menu"
            ref={menu}
            onKeyDown={(event) => {
              if (event.key === "Escape" && menu.current) {
                menu.current.open = false;
                menu.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary aria-label="Abrir menu">
              <span />
              <span />
            </summary>
            <nav aria-label="Menu no celular">
              <Link
                href="/?categoria=TENIS#colecao"
                onClick={() => {
                  if (menu.current) menu.current.open = false;
                }}
              >
                Explorar coleção ↗
              </Link>
              <a
                href="#categorias"
                onClick={() => {
                  if (menu.current) menu.current.open = false;
                }}
              >
                Categorias ↗
              </a>
              <a
                href="#sobre"
                onClick={() => {
                  if (menu.current) menu.current.open = false;
                }}
              >
                Universo Maia ↗
              </a>
              <Link href="/conta">Minha conta ↗</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
