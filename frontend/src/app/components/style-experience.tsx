"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const looks = [
  {
    label: "Os essenciais",
    image: "095",
    product: "Samba branco e preto",
    tone: "essential",
  },
  {
    label: "Tons naturais",
    image: "087",
    product: "Samba creme e caramelo",
    tone: "natural",
  },
  {
    label: "Com presença",
    image: "100",
    product: "Samba vinho e branco",
    tone: "presence",
  },
];

export default function StyleExperience() {
  const [active, setActive] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const look = looks[active];
  const next = looks[(active + 1) % looks.length];
  const changeLook = (direction: number) =>
    setActive((current) => (current + direction + looks.length) % looks.length);

  return (
    <section
      id="estilos"
      className={`campaign campaign-${look.tone}`}
      aria-labelledby="campaign-title"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--drift",
          `${(event.clientX - bounds.left - bounds.width / 2) * 0.012}px`,
        );
      }}
      onPointerLeave={(event) =>
        event.currentTarget.style.setProperty("--drift", "0px")
      }
    >
      <div className="campaign-grid" aria-hidden="true" />
      <div className="campaign-halo" aria-hidden="true" />
      <div className="campaign-content">
        <p className="campaign-eyebrow">
          <span /> MAIA SHOES & BAGS{" "}
          <span className="campaign-edition">/ SELEÇÃO DE ESTILOS</span>
        </p>
        <h1 id="campaign-title">
          <span>VISTA SUA</span>
          <span className="campaign-title-accent">
            ATITUDE<span className="campaign-period">.</span>
          </span>
        </h1>
        <p className="campaign-intro">
          O estilo é seu. O próximo passo também.
          <br />
          Descubra peças que acompanham quem você é.
        </p>
        <div className="campaign-actions">
          <a href="/colecao" className="campaign-cta">
            Explorar coleção <span aria-hidden="true">↗</span>
          </a>
          <a href="#categorias" className="campaign-secondary">
            Encontre seu estilo <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
      <div
        className="campaign-photos"
        aria-label="Inspirações Maia. Deslize na horizontal para trocar de estilo."
        onTouchStart={(event) => {
          touchStart.current = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          };
        }}
        onTouchEnd={(event) => {
          if (!touchStart.current) return;
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5)
            changeLook(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
      >
        <button
          className="campaign-preview"
          type="button"
          onClick={() => changeLook(1)}
          aria-label={`Explorar próximo estilo: ${next.label}`}
        >
          <span className="campaign-preview-image" key={next.image}>
            <Image
              src={`/products/foto-${next.image}.jpeg`}
              alt=""
              fill
              sizes="(max-width: 700px) 30vw, 240px"
            />
          </span>
          <span className="campaign-preview-label">
            A SEGUIR / {next.label}
            <span aria-hidden="true">↗</span>
          </span>
        </button>
        <div className="campaign-feature">
          <div className="campaign-feature-image" key={look.image}>
            <Image
              src={`/products/foto-${look.image}.jpeg`}
              alt={look.product}
              fill
              sizes="(max-width: 700px) 55vw, (max-width: 1100px) 25vw, 320px"
              priority={active === 0}
            />
          </div>
          <div
            className="campaign-feature-caption"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>NA SELEÇÃO MAIA</span>
            <Link
              href={`/colecao?categoria=TENIS&busca=${encodeURIComponent(look.product)}`}
            >
              {look.product} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div
            className="photo-navigation"
            role="group"
            aria-label="Trocar destaque"
          >
            <button
              type="button"
              onClick={() => changeLook(-1)}
              aria-label="Estilo anterior"
            >
              ←
            </button>
            <span>
              {active + 1} / {looks.length}
            </span>
            <button
              type="button"
              onClick={() => changeLook(1)}
              aria-label="Próximo estilo"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
