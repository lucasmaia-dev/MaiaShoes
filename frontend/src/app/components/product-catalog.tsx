"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listProducts, type Product } from "@/lib/products-api";
import { PUBLIC_CATEGORIES, categoryLabel } from "@/lib/product-categories";
import ProductGallery from "./product-gallery";
import { useFavorites } from "@/lib/favorites";
import { HeartIcon } from "./store-header";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
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

function ProductDetails({
  product,
  close,
}: {
  product: Product;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const requestClose = () => {
    dialog.current?.close();
    close();
  };
  useEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="product-dialog"
      aria-labelledby="detail-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="detail-layout">
        <ProductGallery name={product.name} images={gallery(product)} />
        <div className="detail-copy">
          <button
            autoFocus
            className="dialog-close"
            type="button"
            onClick={requestClose}
            aria-label="Fechar detalhes"
          >
            ×
          </button>
          <p className="eyebrow">MAIA / {categoryLabel(product.category)}</p>
          <h2 id="detail-title">{product.name}</h2>
          <p className="detail-price">
            {currency.format(Number(product.price))}
          </p>
          {product.description &&
            product.description !==
              "Consulte a disponibilidade de numeração com a MaiaShoes." && (
              <p className="detail-description">{product.description}</p>
            )}
          <div className="availability">
            <span aria-hidden="true">◇</span>
            <p>
              A sua próxima escolha começa pelos detalhes.
              <br />
              Consulte a disponibilidade desta peça antes de comprar.
            </p>
          </div>
          <button className="button" onClick={requestClose} type="button">
            Continuar explorando <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function ProductCatalog() {
  const params = useSearchParams();
  const category =
    PUBLIC_CATEGORIES.find((item) => item.value === params.get("categoria"))
      ?.value ?? "TENIS";
  const initialSearch = params.get("busca") ?? "";
  const onlyFavorites = params.get("favoritos") === "1";
  // A URL permite chegar a uma peça pelo destaque e compartilhar uma categoria.
  return (
    <CategoryCatalog
      key={`${category}:${initialSearch}:${onlyFavorites}`}
      category={category}
      initialSearch={initialSearch}
      onlyFavorites={onlyFavorites}
    />
  );
}

function CategoryCatalog({
  category,
  initialSearch,
  onlyFavorites,
}: {
  category: (typeof PUBLIC_CATEGORIES)[number]["value"];
  initialSearch: string;
  onlyFavorites: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [brand, setBrand] = useState("Todas");
  const { ids: favorites, toggle: toggleFavorite } = useFavorites();
  const [sort, setSort] = useState("selection");
  const [limit, setLimit] = useState(12);
  const [selected, setSelected] = useState<Product | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const loadProducts = useCallback((signal?: AbortSignal) => {
    return listProducts(signal).then(
      (result) => {
        if (signal?.aborted) return;
        setProducts(result);
        setLoading(false);
      },
      () => {
        if (signal?.aborted) return;
        setError(true);
        setLoading(false);
      },
    );
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const categoryProducts = products.filter(
    (product) =>
      product.imageUrl &&
      product.category !== "SEM_CATEGORIA" &&
      (onlyFavorites || product.category === category),
  );
  const matches = categoryProducts
    .filter(
      (product) =>
        normalize(product.name).includes(normalize(search.trim())) &&
        (!onlyFavorites || favorites.includes(product.id)) &&
        (brand === "Todas" ||
          (brand === "Adidas"
            ? /adidas|samba|campus|gazelle/.test(normalize(product.name))
            : normalize(product.name).includes(normalize(brand)))),
    )
    .sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return selectionRank(a) - selectionRank(b) || a.id - b.id;
    });
  const closeDetails = () => {
    setSelected(null);
    opener.current?.focus();
  };

  return (
    <>
      <nav className="catalog-tabs" aria-label="Filtrar coleção por categoria">
        {PUBLIC_CATEGORIES.map((item) => (
          <Link
            key={item.value}
            href={`/?categoria=${item.value}#colecao`}
            aria-current={
              !onlyFavorites && item.value === category ? "page" : undefined
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
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
            type="search"
            placeholder="Busque por modelo ou marca"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(12);
            }}
          />
        </label>
        <label className="catalog-sort">
          <span>Ordenar por</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setLimit(12);
            }}
          >
            <option value="selection">Seleção Maia</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome: A a Z</option>
          </select>
        </label>
      </div>
      <div className="catalog-refinements">
        <div
          className="brand-filters"
          role="group"
          aria-label="Filtrar por marca"
        >
          {["Todas", "Nike", "Adidas", "New Balance", "Vans", "Mizuno"].map(
            (item) => (
              <button
                key={item}
                type="button"
                aria-pressed={item === brand}
                onClick={() => {
                  setBrand(item);
                  setLimit(12);
                }}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <Link
          className={`favorites-filter ${onlyFavorites ? "is-active" : ""}`}
          href={`/?categoria=${category}${onlyFavorites ? "" : "&favoritos=1"}#colecao`}
        >
          <HeartIcon filled={onlyFavorites} /> Meus favoritos
          {onlyFavorites && <span>×</span>}
        </Link>
      </div>
      {loading ? (
        <div className="catalog-message" role="status">
          Carregando seus próximos favoritos…
        </div>
      ) : error ? (
        <div className="catalog-message">
          <p role="alert">Não foi possível carregar a coleção.</p>
          <button
            className="button"
            type="button"
            onClick={() => {
              setLoading(true);
              setError(false);
              void loadProducts();
            }}
          >
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
              </span>
            </p>
            <span>
              {onlyFavorites
                ? "Salvos neste navegador"
                : "Encontre uma peça. Descubra os detalhes."}
            </span>
          </div>
          {!matches.length && (
            <div className="catalog-empty">
              <span className="empty-monogram" aria-hidden="true">
                M
              </span>
              <h3>
                {onlyFavorites
                  ? "Guarde o que faz seu estilo."
                  : categoryProducts.length
                    ? "Ainda não encontramos essa combinação."
                    : `${categoryLabel(category)}: em breve por aqui.`}
              </h3>
              <p>
                {onlyFavorites
                  ? "Toque no coração das peças que você gosta. Elas ficam salvas neste navegador para você rever depois."
                  : categoryProducts.length
                    ? "Experimente outro modelo, outra marca ou limpe os filtros."
                    : "Estamos preparando esta seleção. Descubra os tênis que já fazem parte da Maia."}
              </p>
              {onlyFavorites ? (
                <Link
                  className="button"
                  href={`/?categoria=${category}#colecao`}
                >
                  Explorar peças <span aria-hidden="true">↗</span>
                </Link>
              ) : categoryProducts.length ? (
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setBrand("Todas");
                    setLimit(12);
                  }}
                >
                  Limpar filtros ↗
                </button>
              ) : (
                <Link className="text-link" href="/?categoria=TENIS#colecao">
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
                      Explorar peça <span aria-hidden="true">↗</span>
                    </span>
                    {gallery(product).length > 1 && (
                      <span className="photo-count">
                        {gallery(product).length} fotos
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <p className="product-category">
                      {categoryLabel(product.category)}
                    </p>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      {currency.format(Number(product.price))}
                    </p>
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
              <p>
                Você viu {Math.min(limit, matches.length)} de {matches.length}{" "}
                peças.
              </p>
              <button
                className="outline-button"
                type="button"
                onClick={() => setLimit((value) => value + 12)}
              >
                Ver mais peças <span aria-hidden="true">↓</span>
              </button>
            </div>
          )}
        </>
      )}
      {selected && <ProductDetails product={selected} close={closeDetails} />}
    </>
  );
}
