"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listProducts, type Product } from "@/lib/products-api";
import { PUBLIC_CATEGORIES, categoryLabel } from "@/lib/product-categories";
import ProductGallery from "./product-gallery";

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

function ProductDetails({
  product,
  close,
}: {
  product: Product;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="detail-layout">
        <ProductGallery name={product.name} images={gallery(product)} />
        <div className="detail-copy">
          <button
            autoFocus
            className="dialog-close"
            type="button"
            onClick={close}
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
          <button className="button" onClick={close} type="button">
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
  // A chave reinicia busca e paginação quando o visitante troca de categoria, inclusive pelo histórico.
  return <CategoryCatalog key={category} category={category} />;
}

function CategoryCatalog({
  category,
}: {
  category: (typeof PUBLIC_CATEGORIES)[number]["value"];
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
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
    (product) => product.imageUrl && product.category === category,
  );
  const matches = categoryProducts
    .filter((product) =>
      normalize(product.name).includes(normalize(search.trim())),
    )
    .sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return a.id - b.id;
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
            aria-current={item.value === category ? "page" : undefined}
          >
            {item.label}
            <span aria-hidden="true">↗</span>
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
          <span className="sr-only">Buscar em {categoryLabel(category)}</span>
          <input
            type="search"
            placeholder={`Encontre seu favorito em ${categoryLabel(category).toLowerCase()}`}
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
              <span> / {categoryLabel(category)}</span>
            </p>
            <span>ESCOLHA NO SEU TEMPO</span>
          </div>
          {!matches.length && (
            <div className="catalog-empty">
              <span className="empty-monogram" aria-hidden="true">
                M
              </span>
              <h3>
                {categoryProducts.length
                  ? "Vamos tentar outra busca?"
                  : `${categoryLabel(category)}: o próximo capítulo.`}
              </h3>
              <p>
                {categoryProducts.length
                  ? "Ainda não encontramos uma peça com esse nome. Experimente outra palavra."
                  : "Estamos preparando esta seleção. Enquanto isso, descubra os tênis que já fazem parte da Maia."}
              </p>
              {categoryProducts.length ? (
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setLimit(12);
                  }}
                >
                  Limpar busca ↗
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
                    <span className="product-view">
                      Ver detalhes <span aria-hidden="true">↗</span>
                    </span>
                    {gallery(product).length > 1 && (
                      <span className="photo-count">
                        {gallery(product).length} fotos
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <p className="product-category">
                      {categoryLabel(product.category)} / Maia selection
                    </p>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      {currency.format(Number(product.price))}
                    </p>
                  </div>
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
