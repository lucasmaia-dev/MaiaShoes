"use client";

import type { Product } from "@/lib/products-api";
import { currency } from "@/lib/catalog-filters";
import { categoryLabel } from "@/lib/product-categories";
import { useFavorites } from "@/lib/favorites";
import ProductGallery from "./product-gallery";
import { HeartIcon } from "./store-header";
import useModal from "./use-modal";

export default function ProductDetails({
  product,
  close,
}: {
  product: Product;
  close: () => void;
}) {
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
          <div className="detail-notes">
            <span aria-hidden="true">◇</span>
            <div>
              <strong>Os detalhes fazem a escolha.</strong>
              <p>
                Explore as fotos e amplie para ver de perto. Numeração e
                disponibilidade sob consulta.
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
