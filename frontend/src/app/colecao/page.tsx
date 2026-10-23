import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import StoreHeader from "../components/store-header";
import ProductCatalog from "../components/product-catalog";

export const metadata: Metadata = {
  title: "Coleção | Maia Shoes & Bags",
  description:
    "Explore a coleção Maia por categoria, marca e preço. Salve suas peças favoritas e descubra os detalhes de cada modelo.",
};

export default function CollectionPage() {
  return (
    <div className="storefront collection-page">
      <a className="skip-link" href="#colecao">
        Ir para os produtos
      </a>
      <StoreHeader collectionPage />
      <main
        id="inicio"
        className="container collection"
        aria-labelledby="collection-title"
      >
        <nav className="collection-breadcrumb" aria-label="Você está em">
          <Link href="/">Início</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Coleção</span>
        </nav>
        <div className="section-heading collection-intro">
          <div>
            <p className="eyebrow">ESCOLHAS COM PERSONALIDADE</p>
            <h1 id="collection-title">
              Seu próximo <em>favorito.</em>
            </h1>
          </div>
          <p>Encontre a peça que faz o seu estilo.</p>
        </div>
        <section id="colecao" aria-label="Produtos da coleção">
          <Suspense
            fallback={
              <p className="catalog-message" role="status">
                Carregando a seleção Maia…
              </p>
            }
          >
            <ProductCatalog />
          </Suspense>
        </section>
      </main>
      <footer className="footer container">
        <div className="footer-bottom">
          <Link href="/">← Voltar ao universo Maia</Link>
          <span>© Maia Shoes & Bags</span>
          <Link href="/#comunidade">Avaliações e sugestões</Link>
        </div>
      </footer>
    </div>
  );
}
