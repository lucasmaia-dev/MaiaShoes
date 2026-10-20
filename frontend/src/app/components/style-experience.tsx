"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const looks = [
  {
    label: "Os essenciais",
    title: (
      <>
        O próximo
        <br />
        passo é seu.
      </>
    ),
    image: "078",
    product: "Samba branco e preto",
    caption: "Clássicos que acompanham o seu ritmo.",
    tone: "essential",
  },
  {
    label: "Tons naturais",
    title: (
      <>
        Leve no look.
        <br />
        Livre na vida.
      </>
    ),
    image: "087",
    product: "Samba creme e caramelo",
    caption: "Texturas e tons para combinar sem esforço.",
    tone: "natural",
  },
  {
    label: "Com presença",
    title: (
      <>
        Presença em
        <br />
        cada passo.
      </>
    ),
    image: "100",
    product: "Samba vinho e branco",
    caption: "Uma escolha que faz parte de quem você é.",
    tone: "presence",
  },
];

export default function StyleExperience() {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLElement>(null);
  const look = looks[active];
  return (
    <section
      ref={stage}
      className={`style-stage stage-${look.tone}`}
      aria-label="Explore os estilos Maia"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--pointer-x",
          `${(event.clientX - bounds.left - bounds.width / 2) * 0.012}px`,
        );
        event.currentTarget.style.setProperty(
          "--pointer-y",
          `${(event.clientY - bounds.top - bounds.height / 2) * 0.012}px`,
        );
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--pointer-x", "0px");
        event.currentTarget.style.setProperty("--pointer-y", "0px");
      }}
    >
      <div className="stage-picture" key={look.image}>
        <Image
          src={`/products/foto-${look.image}.jpeg`}
          alt={look.product}
          fill
          sizes="(max-width: 700px) 100vw, 70vw"
          priority={active === 0}
        />
      </div>
      <div className="stage-shade" />
      <span className="stage-watermark" aria-hidden="true">
        maia
      </span>
      <div className="stage-copy" key={look.label}>
        <span className="stage-chip">
          <span /> SELEÇÃO MAIA
        </span>
        <h1>{look.title}</h1>
        <p>{look.caption}</p>
        <Link href="/?categoria=TENIS#colecao" className="button button-light">
          Explorar coleção{" "}
          <span className="round-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
      </div>
      <Link
        className="stage-pick"
        href={`/?categoria=TENIS&busca=${encodeURIComponent(look.product)}#colecao`}
      >
        <span className="stage-pick-photo">
          <Image
            src={`/products/foto-${look.image}.jpeg`}
            width={58}
            height={68}
            alt=""
          />
        </span>
        <span>
          <small>NESTE LOOK</small>
          <strong>{look.product}</strong>
          <span>Conhecer a peça</span>
        </span>
        <span className="round-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="stage-bottom">
        <div className="look-tabs" role="group" aria-label="Escolher estilo">
          {looks.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="look-controls">
          <span aria-live="polite">
            0{active + 1}
            <span> / 03</span>
          </span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setActive((active + 2) % 3)}
            aria-label="Estilo anterior"
          >
            ←
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setActive((active + 1) % 3)}
            aria-label="Próximo estilo"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
