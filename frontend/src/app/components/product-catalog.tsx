"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listProducts, type Product } from "@/lib/products-api";
import { PUBLIC_CATEGORIES, categoryLabel } from "@/lib/product-categories";
import { useFavorites } from "@/lib/favorites";
import {
  DEFAULT_FILTERS,
  currency,
  normalize,
  matchesFilters,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import {
  FOOTWEAR_LINES,
  parseFootwearLine,
  hasFootwearSizing,
  type FootwearLine,
} from "@/lib/product-sizing";
import ProductDetails from "./product-details";
import { HeartIcon } from "./store-header";
import CatalogFilterPanel, { FilterIcon } from "./catalog-filter-panel";

const gallery = (product: Product) =>
  product.imageUrls.length ? product.imageUrls : [product.imageUrl!];
const featuredNames = [
  "Samba branco e preto",
  "Samba creme e caramelo",
  "Samba vinho e branco",
  "Samba preto e branco",
];
const selectionRank = (product: Product) => {
  const rank = featuredNames.indexOf(product.name);
  return rank < 0 ? featuredNames.length : rank;
};
const sortLabels: Record<string, string> = {
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  name: "Nome: A a Z",
};

function CatalogSkeleton() {
  return (
    <div role="status" aria-label="Carregando a coleção">
      <span className="sr-only">Carregando a coleção…</span>
      <div className="product-grid catalog-skeleton" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <div className="skeleton-photo" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductCatalog() {
  const params = useSearchParams();
  const category =
    PUBLIC_CATEGORIES.find((item) => item.value === params.get("categoria"))
      ?.value ?? "TENIS";
  const line = parseFootwearLine(params.get("linha"));
  const initialSearch = params.get("busca") ?? "";
  const onlyFavorites = params.get("favoritos") === "1";
  // A troca de categoria reutiliza os dados carregados, sem piscar toda a coleção.
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadProducts = useCallback(
    (signal?: AbortSignal) =>
      listProducts(signal).then(
        (result) => {
          if (signal?.aborted) return;
          setProducts(result);
          setLoading(false);
          setError(false);
        },
        () => {
          if (!signal?.aborted) {
            setError(true);
            setLoading(false);
          }
        },
      ),
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);
  useEffect(() => {
    if (!error) return;
    const controller = new AbortController();
    const retry = () => {
      if (document.visibilityState === "visible")
        void loadProducts(controller.signal);
    };
    const timers = [4000, 12000, 25000].map((delay) =>
      window.setTimeout(retry, delay),
    );
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      controller.abort();
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [error, loadProducts]);
  return (
    <CategoryCatalog
      key={`${category}:${initialSearch}:${onlyFavorites}:${line}`}
      line={line}
      category={category}
      initialSearch={initialSearch}
      onlyFavorites={onlyFavorites}
      products={products}
      loading={loading}
      error={error}
      retry={() => {
        setLoading(true);
        setError(false);
        void loadProducts();
      }}
    />
  );
}

type CatalogProps = {
  line: FootwearLine | null;
  category: (typeof PUBLIC_CATEGORIES)[number]["value"];
  initialSearch: string;
  onlyFavorites: boolean;
  products: Product[];
  loading: boolean;
  error: boolean;
  retry: () => void;
};

function CategoryCatalog({
  line,
  category,
  initialSearch,
  onlyFavorites,
  products,
  loading,
  error,
  retry,
}: CatalogProps) {
  const lineQuery = line ? `&linha=${line}` : "";
  const lineInfo = FOOTWEAR_LINES.find((item) => item.value === line);
  const lineHref = (value: FootwearLine | null) => {
    const query = new URLSearchParams({ categoria: category });
    if (value) query.set("linha", value);
    if (onlyFavorites) query.set("favoritos", "1");
    if (search) query.set("busca", search);
    return `/colecao?${query}`;
  };
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  const [selected, setSelected] = useState<Product | null>(null);
  const { ids: favorites, toggle: toggleFavorite } = useFavorites();
  const opener = useRef<HTMLButtonElement | null>(null);
  const filterOpener = useRef<HTMLButtonElement>(null);
  const categoryProducts = products.filter(
    (product) =>
      product.imageUrl &&
      product.category !== "SEM_CATEGORIA" &&
      (onlyFavorites || product.category === category) &&
      (!line || hasFootwearSizing(product.category)),
  );
  const searched = categoryProducts.filter(
    (product) =>
      normalize(product.name).includes(normalize(search.trim())) &&
      (!onlyFavorites || favorites.includes(product.id)),
  );
  const matches = searched
    .filter((product) => matchesFilters(product, filters))
    .sort((a, b) => {
      if (filters.sort === "price-asc")
        return Number(a.price) - Number(b.price);
      if (filters.sort === "price-desc")
        return Number(b.price) - Number(a.price);
      if (filters.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return selectionRank(a) - selectionRank(b) || a.id - b.id;
    });
  const filterCount =
    Number(filters.brand !== "Todas") +
    Number(filters.maxPrice !== null) +
    Number(filters.sort !== "selection");
  const hasSelection = Boolean(search || filterCount);
  const updateFilters = (next: CatalogFilters) => {
    setFilters(next);
    setLimit(12);
  };
  const reset = () => {
    setSearch("");
    updateFilters(DEFAULT_FILTERS);
  };
  const closeFilters = () => {
    setFiltersOpen(false);
    filterOpener.current?.focus();
  };
  const closeDetails = () => {
    setSelected(null);
    opener.current?.focus();
  };
  const emptyFavorites =
    onlyFavorites &&
    !categoryProducts.some((product) => favorites.includes(product.id));

  return (
    <>
      <nav className="collection-lines" aria-label="Escolher linha da coleção">
        <Link href={lineHref(null)} aria-current={!line ? "page" : undefined}>
          Toda a coleção
        </Link>
        {FOOTWEAR_LINES.map((item) => (
          <Link
            key={item.value}
            href={lineHref(item.value)}
            aria-current={line === item.value ? "page" : undefined}
          >
            <span>{item.label}</span>
            <small>
              {item.sizes[0]}–{item.sizes[item.sizes.length - 1]}
            </small>
          </Link>
        ))}
      </nav>
      <nav className="catalog-tabs" aria-label="Filtrar coleção por categoria">
        {PUBLIC_CATEGORIES.map((item) => (
          <Link
            key={item.value}
            href={`/colecao?categoria=${item.value}${lineQuery}`}
            aria-current={
              !onlyFavorites && item.value === category ? "page" : undefined
            }
          >
            <span>{item.label}</span>
            {!loading && !error && (
              <small>
                {
                  products.filter(
                    (product) =>
                      product.imageUrl &&
                      product.category === item.value &&
                      (!line || hasFootwearSizing(product.category)),
                  ).length
                }
              </small>
            )}
          </Link>
        ))}
      </nav>
      {!loading && !error && categoryProducts.length > 0 && !emptyFavorites && (
        <>
          <div className="catalog-toolbar">
            <label className="catalog-search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <span className="sr-only">
                {onlyFavorites
                  ? "Buscar nos favoritos"
                  : `Buscar em ${categoryLabel(category)}`}
              </span>
              <input
                id="catalog-search"
                type="search"
                placeholder="Qual peça combina com você?"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setLimit(12);
                }}
              />
            </label>
            <div className="catalog-tools">
              <button
                ref={filterOpener}
                className={`filter-trigger ${filterCount ? "has-filters" : ""}`}
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-controls={filtersOpen ? "catalog-filter-panel" : undefined}
              >
                <FilterIcon />
                <span>Filtros</span>
                {filterCount > 0 && <small>{filterCount}</small>}
              </button>
              <label className="catalog-sort">
                <span className="sr-only">Ordenar por</span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    updateFilters({ ...filters, sort: event.target.value })
                  }
                >
                  <option value="selection">Seleção Maia</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="name">Nome: A a Z</option>
                </select>
              </label>
              <Link
                className={`favorites-filter ${onlyFavorites ? "is-active" : ""}`}
                href={`/colecao?categoria=${category}${onlyFavorites ? "" : "&favoritos=1"}${lineQuery}`}
                aria-label={
                  onlyFavorites
                    ? "Voltar à coleção completa"
                    : "Ver meus favoritos"
                }
                title={onlyFavorites ? "Voltar à coleção" : "Meus favoritos"}
              >
                <HeartIcon filled={onlyFavorites} />
              </Link>
            </div>
          </div>
          {hasSelection && (
            <div
              className="active-filters"
              role="group"
              aria-label="Escolhas aplicadas"
            >
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setLimit(12);
                  }}
                  aria-label={`Remover busca ${search}`}
                >
                  <span>“{search}”</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}
              {filters.brand !== "Todas" && (
                <button
                  type="button"
                  onClick={() => updateFilters({ ...filters, brand: "Todas" })}
                  aria-label={`Remover filtro de marca ${filters.brand}`}
                >
                  {filters.brand}
                  <span aria-hidden="true">×</span>
                </button>
              )}
              {filters.maxPrice !== null && (
                <button
                  type="button"
                  onClick={() => updateFilters({ ...filters, maxPrice: null })}
                  aria-label="Remover limite de preço"
                >
                  Até {currency.format(filters.maxPrice)}
                  <span aria-hidden="true">×</span>
                </button>
              )}
              {filters.sort !== "selection" && (
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ ...filters, sort: "selection" })
                  }
                  aria-label="Restaurar ordenação da seleção"
                >
                  {sortLabels[filters.sort]}
                  <span aria-hidden="true">×</span>
                </button>
              )}
              <button type="button" className="clear-filters" onClick={reset}>
                Limpar tudo
              </button>
            </div>
          )}
        </>
      )}
      {loading ? (
        <CatalogSkeleton />
      ) : error ? (
        <div className="catalog-message">
          <p role="alert">A coleção está temporariamente indisponível.</p>
          <p>Confira sua conexão ou tente novamente em instantes.</p>
          <button className="button" type="button" onClick={retry}>
            Tentar novamente ↗
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-meta">
            <p role="status">
              {matches.length}{" "}
              {matches.length === 1 ? "peça encontrada" : "peças encontradas"}
              <span>
                {" "}
                / {onlyFavorites ? "Meus favoritos" : categoryLabel(category)}
                {lineInfo ? ` / ${lineInfo.label}` : ""}
              </span>
            </p>
            <span>
              {onlyFavorites
                ? "Salvos neste navegador"
                : lineInfo
                  ? `Numeração ${lineInfo.sizes[0]} a ${lineInfo.sizes[lineInfo.sizes.length - 1]}`
                  : "Uma seleção para chamar de sua."}
            </span>
          </div>
          {!matches.length && (
            <div className="catalog-empty">
              <span className="empty-monogram" aria-hidden="true">
                m.
              </span>
              <h3>
                {emptyFavorites
                  ? "Guarde o que faz seu estilo."
                  : categoryProducts.length
                    ? "Uma nova combinação te espera."
                    : `${categoryLabel(category)}: em breve por aqui.`}
              </h3>
              <p>
                {emptyFavorites
                  ? "Toque no coração das peças que você gosta e volte para elas quando quiser."
                  : categoryProducts.length
                    ? "Não encontramos peças com essa combinação. Ajuste os filtros e descubra outras possibilidades."
                    : "Estamos preparando esta seleção. Enquanto isso, explore os tênis que já fazem parte da Maia."}
              </p>
              {emptyFavorites ? (
                <Link
                  className="button"
                  href={`/colecao?categoria=${category}${lineQuery}`}
                >
                  Explorar a coleção <span aria-hidden="true">↗</span>
                </Link>
              ) : categoryProducts.length ? (
                <button className="text-link" type="button" onClick={reset}>
                  Limpar escolhas ↗
                </button>
              ) : (
                <Link
                  className="text-link"
                  href={`/colecao?categoria=TENIS${lineQuery}`}
                >
                  Explorar tênis ↗
                </Link>
              )}
            </div>
          )}
          <div className="product-grid">
            {matches.slice(0, limit).map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  type="button"
                  className="product-open"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setSelected(product);
                  }}
                  aria-label={`Ver detalhes de ${product.name}`}
                >
                  <div className="product-photo">
                    <Image
                      src={product.imageUrl!}
                      alt={product.name}
                      fill
                      sizes="(max-width: 700px) 45vw, (max-width: 1050px) 30vw, 23vw"
                    />
                    {gallery(product).length > 1 && (
                      <Image
                        className="product-alternate"
                        src={gallery(product)[1]}
                        alt=""
                        fill
                        sizes="(max-width: 700px) 45vw, (max-width: 1050px) 30vw, 23vw"
                      />
                    )}
                    <span className="product-view">
                      Ver de perto <span aria-hidden="true">↗</span>
                    </span>
                    {gallery(product).length > 1 && (
                      <span className="photo-count">
                        {gallery(product).length} fotos
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      {currency.format(Number(product.price))}
                    </p>
                    {onlyFavorites && (
                      <p className="product-category">
                        {categoryLabel(product.category)}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  className="product-favorite icon-button"
                  aria-pressed={favorites.includes(product.id)}
                  aria-label={`${favorites.includes(product.id) ? "Remover" : "Salvar"} ${product.name} ${favorites.includes(product.id) ? "dos" : "nos"} favoritos`}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <HeartIcon filled={favorites.includes(product.id)} />
                </button>
              </article>
            ))}
          </div>
          {limit < matches.length && (
            <div className="load-more">
              <div
                className="collection-progress"
                role="progressbar"
                aria-label="Peças exibidas da coleção"
                aria-valuemin={0}
                aria-valuemax={matches.length}
                aria-valuenow={Math.min(limit, matches.length)}
              >
                <span
                  style={{
                    width: `${Math.min(limit / matches.length, 1) * 100}%`,
                  }}
                />
              </div>
              <p>
                Você explorou {Math.min(limit, matches.length)} de{" "}
                {matches.length} peças.
              </p>
              <button
                className="outline-button"
                type="button"
                onClick={() => setLimit((value) => value + 12)}
              >
                Descobrir mais peças <span aria-hidden="true">↓</span>
              </button>
            </div>
          )}
        </>
      )}
      {filtersOpen && (
        <CatalogFilterPanel
          initial={filters}
          products={searched}
          onApply={(next) => {
            updateFilters(next);
            closeFilters();
          }}
          onClose={closeFilters}
        />
      )}
      {selected && (
        <ProductDetails
          product={selected}
          initialLine={line}
          close={closeDetails}
        />
      )}
    </>
  );
}
