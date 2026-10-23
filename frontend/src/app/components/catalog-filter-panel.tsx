"use client";

import { useState } from "react";
import type { Product } from "@/lib/products-api";
import {
  CATALOG_BRANDS,
  PRICE_LIMITS,
  DEFAULT_FILTERS,
  currency,
  matchesFilters,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import useModal from "./use-modal";

export function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function CatalogFilterPanel({
  initial,
  products,
  onApply,
  onClose,
}: {
  initial: CatalogFilters;
  products: Product[];
  onApply: (filters: CatalogFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const { dialog, dismiss } = useModal(onClose);
  const count = products.filter((product) =>
    matchesFilters(product, draft),
  ).length;
  return (
    <dialog
      ref={dialog}
      id="catalog-filter-panel"
      className="filter-dialog"
      aria-labelledby="filter-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className="filter-panel">
        <header className="filter-panel-header">
          <div>
            <p className="eyebrow">DO SEU JEITO</p>
            <h2 id="filter-title">Refine sua escolha.</h2>
          </div>
          <button
            autoFocus
            type="button"
            className="icon-button"
            aria-label="Fechar filtros sem aplicar"
            onClick={dismiss}
          >
            ×
          </button>
        </header>
        <div className="filter-panel-body">
          <fieldset>
            <legend>Marca</legend>
            <p>Encontre seus modelos favoritos.</p>
            <div className="filter-options">
              {CATALOG_BRANDS.map((brand) => (
                <button
                  type="button"
                  key={brand}
                  aria-pressed={brand === draft.brand}
                  onClick={() => setDraft({ ...draft, brand })}
                >
                  <span className="selection-dot" aria-hidden="true" />
                  <span>{brand === "Todas" ? "Todas as marcas" : brand}</span>
                  <small>
                    {
                      products.filter((product) =>
                        matchesFilters(product, { ...draft, brand }),
                      ).length
                    }
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Faixa de preço</legend>
            <p>Escolha o valor máximo que quer explorar.</p>
            <div className="filter-options price-options">
              {PRICE_LIMITS.map((maxPrice) => (
                <button
                  key={maxPrice ?? "all"}
                  type="button"
                  aria-pressed={draft.maxPrice === maxPrice}
                  onClick={() => setDraft({ ...draft, maxPrice })}
                >
                  <span className="selection-dot" aria-hidden="true" />
                  <span>
                    {maxPrice === null
                      ? "Todos os preços"
                      : `Até ${currency.format(maxPrice)}`}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="panel-sort">
            <span>Ordenar a coleção</span>
            <select
              value={draft.sort}
              onChange={(event) =>
                setDraft({ ...draft, sort: event.target.value })
              }
            >
              <option value="selection">Seleção Maia</option>
              <option value="price-asc">Menor preço primeiro</option>
              <option value="price-desc">Maior preço primeiro</option>
              <option value="name">Nome: A a Z</option>
            </select>
          </label>
        </div>
        <footer className="filter-panel-footer">
          <div>
            <span role="status">
              {count} {count === 1 ? "peça combina" : "peças combinam"} com a
              sua escolha
            </span>
            <button
              type="button"
              className="panel-reset"
              onClick={() => setDraft(DEFAULT_FILTERS)}
            >
              Limpar
            </button>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => {
              dialog.current?.close();
              onApply(draft);
            }}
          >
            {count
              ? `Ver ${count} ${count === 1 ? "peça" : "peças"}`
              : "Aplicar filtros"}
            <span className="round-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        </footer>
      </div>
    </dialog>
  );
}
