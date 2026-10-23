"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FOOTWEAR_LINES,
  hasFootwearSizing,
  type FootwearLine,
} from "@/lib/product-sizing";
import type { Product } from "@/lib/products-api";
import { currency } from "@/lib/catalog-filters";
import { categoryLabel } from "@/lib/product-categories";
import { useFavorites } from "@/lib/favorites";
import { useCart } from "@/lib/cart";
import ProductGallery from "./product-gallery";
import { HeartIcon } from "./store-header";
import useModal from "./use-modal";

export default function ProductDetails({
  product,
  initialLine = null,
  close,
}: {
  product: Product;
  initialLine?: FootwearLine | null;
  close: () => void;
}) {
  const [line, setLine] = useState<FootwearLine>(initialLine ?? "FEMININO");
  const [size, setSize] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState("");
  const { add } = useCart();
  const sizeGuide = FOOTWEAR_LINES.find((item) => item.value === line)!;
  const { dialog, dismiss } = useModal(close);
  const { ids, toggle } = useFavorites();
  const saved = ids.includes(product.id);
  const images = product.imageUrls.length
    ? product.imageUrls
    : [product.imageUrl!];
  return (
    <dialog
      ref={dialog}
      className="product-dialog"
      aria-labelledby="detail-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className="detail-layout">
        <ProductGallery name={product.name} images={images} />
        <div className="detail-copy">
          <button
            autoFocus
            className="dialog-close"
            type="button"
            onClick={dismiss}
            aria-label="Fechar detalhes"
          >
            ×
          </button>
          <div className="detail-breadcrumb">
            <span>Seleção Maia</span>
            <span aria-hidden="true">/</span>
            <span>{categoryLabel(product.category)}</span>
          </div>
          <h2 id="detail-title">{product.name}</h2>
          <p className="detail-price">
            {currency.format(Number(product.price))}
          </p>
          {product.description &&
            product.description !==
              "Consulte a disponibilidade de numeração com a MaiaShoes." && (
              <p className="detail-description">{product.description}</p>
            )}
          {hasFootwearSizing(product.category) && (
            <section className="detail-sizing" aria-labelledby="sizing-title">
              <h3 id="sizing-title">Numeração</h3>
              <div
                className="sizing-lines"
                role="group"
                aria-label="Consultar grade de tamanhos"
              >
                {FOOTWEAR_LINES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={line === item.value}
                    onClick={() => {
                      setLine(item.value);
                      setSize(null);
                      setCartMessage("");
                    }}
                  >
                    {item.label}{" "}
                    <small>
                      {item.sizes[0]}–{item.sizes[item.sizes.length - 1]}
                    </small>
                  </button>
                ))}
              </div>
              <p className="sr-only" role="status">
                {sizeGuide.label}: tamanhos {sizeGuide.sizes.join(", ")}
              </p>
              <ol
                className="size-grid"
                aria-label={`Tamanhos da linha ${sizeGuide.label.toLowerCase()}`}
              >
                {sizeGuide.sizes.map((number) => (
                  <li key={number}>
                    <button
                      type="button"
                      aria-pressed={size === number}
                      onClick={() => {
                        setSize(number);
                        setCartMessage("");
                      }}
                      aria-label={`Selecionar tamanho ${number}`}
                    >
                      {number}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="size-caption">
                Grade brasileira · você também pode escolher a numeração ao
                finalizar a compra.
              </p>
            </section>
          )}
          <div className="detail-notes">
            <span aria-hidden="true">◇</span>
            <div>
              <strong>Os detalhes fazem a escolha.</strong>
              <p>
                Explore as fotos e amplie para ver de perto. Escolha sua peça e
                pague com Pix.
              </p>
            </div>
          </div>
          <dl className="detail-specs">
            <div>
              <dt>Categoria</dt>
              <dd>{categoryLabel(product.category)}</dd>
            </div>
            <div>
              <dt>Galeria</dt>
              <dd>
                {images.length} {images.length === 1 ? "foto" : "fotos"}
              </dd>
            </div>
          </dl>
          <div className="detail-actions">
            <button
              className="button"
              type="button"
              onClick={() => {
                try {
                  add({
                    productId: product.id,
                    quantity: 1,
                    ...(hasFootwearSizing(product.category) && size !== null
                      ? { line, size }
                      : {}),
                  });
                  setCartMessage("Peça adicionada ao carrinho.");
                } catch (error) {
                  setCartMessage(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível adicionar a peça.",
                  );
                }
              }}
            >
              Adicionar ao carrinho <span aria-hidden="true">+</span>
            </button>
            {cartMessage && (
              <p role="status">
                {cartMessage} <Link href="/carrinho">Ver carrinho →</Link>
              </p>
            )}
            <Link className="button" href={`/checkout?produto=${product.id}`}>
              Comprar com Pix <span aria-hidden="true">↗</span>
            </Link>
            <button
              className={`button detail-save ${saved ? "is-saved" : ""}`}
              type="button"
              onClick={() => toggle(product.id)}
              aria-pressed={saved}
            >
              <HeartIcon filled={saved} />
              {saved ? "Salvo nos favoritos" : "Salvar nos favoritos"}
              <span aria-hidden="true">{saved ? "✓" : "+"}</span>
            </button>
            <button
              className="text-link detail-back"
              onClick={dismiss}
              type="button"
            >
              Continuar explorando <span aria-hidden="true">↗</span>
            </button>
            <p>Seus favoritos ficam salvos neste navegador.</p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
