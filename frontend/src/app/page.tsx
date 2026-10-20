import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import ProductCatalog from "./components/product-catalog";
import StoreHeader from "./components/store-header";
import StyleExperience from "./components/style-experience";
import ScrollReveal from "./components/scroll-reveal";

const categories = [
  {
    value: "TENIS",
    label: "Tênis",
    image: "080",
    note: "Encontre o seu ritmo",
    position: "center 55%",
  },
  {
    value: "SAPATOS",
    label: "Sapatos",
    image: "002",
    note: "Seleção em preparação",
    position: "center 80%",
  },
  {
    value: "SANDALIAS",
    label: "Sandálias",
    image: null,
    note: "Seleção em preparação",
    position: "center",
  },
  {
    value: "BOLSAS",
    label: "Bolsas",
    image: "019",
    note: "Seleção em preparação",
    position: "center 65%",
  },
];

export default function Home() {
  return (
    <div className="storefront">
      <a className="skip-link" href="#colecao">
        Ir para a coleção
      </a>
      <StoreHeader />
      <main id="inicio">
        <div className="stage-container">
          <StyleExperience />
        </div>
        <div className="discovery-line container">
          <span>SEU ESTILO. SUAS ESCOLHAS.</span>
          <a href="#categorias">
            Deslize para descobrir <span aria-hidden="true">↓</span>
          </a>
        </div>
        <section
          id="categorias"
          className="category-section container"
          aria-labelledby="categories-title"
          data-reveal
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE POR CATEGORIA</p>
              <h2 id="categories-title">Qual é a sua vibe?</h2>
            </div>
            <a className="text-link" href="#colecao">
              Ver a coleção <span aria-hidden="true">↗</span>
            </a>
          </div>
          <nav className="category-grid" aria-label="Categorias de produtos">
            {categories.map((category, index) => (
              <Link
                className={`category-tile category-${category.value.toLowerCase()}`}
                href={`/?categoria=${category.value}#colecao`}
                key={category.value}
              >
                {category.image ? (
                  <Image
                    src={`/products/foto-${category.image}.jpeg`}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 68vw, 24vw"
                    style={{ objectPosition: category.position }}
                  />
                ) : (
                  <div className="sandal-art" aria-hidden="true">
                    <svg viewBox="0 0 240 300" fill="none">
                      <path
                        d="M113 30c-35 2-59 44-55 89l10 108c3 28 14 47 35 48s43-21 45-49l15-123c4-42-15-75-50-73Z"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        d="m64 123 88 26M68 150l81 24M80 198l58 14M73 63l73 145M143 58 78 197"
                        stroke="currentColor"
                        strokeWidth="11"
                        strokeLinecap="round"
                      />
                      <path
                        d="m140 214-5 27M108 36l1 16"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                    </svg>
                    <span>DIAS MAIS LEVES</span>
                  </div>
                )}
                <span className="category-index">0{index + 1}</span>
                {category.value !== "TENIS" && (
                  <span className="category-coming">Em breve</span>
                )}
                <div className="category-caption">
                  <div>
                    <h3>{category.label}</h3>
                    <p>{category.note}</p>
                  </div>
                  <span className="round-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        </section>
        <section
          id="colecao"
          className="collection container"
          aria-labelledby="collection-title"
          data-reveal
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">ESCOLHAS COM PERSONALIDADE</p>
              <h2 id="collection-title">Seu próximo favorito.</h2>
            </div>
            <p>Explore. Combine. Se encontre.</p>
          </div>
          <Suspense
            fallback={
              <div className="catalog-message" role="status">
                Carregando a seleção Maia…
              </div>
            }
          >
            <ProductCatalog />
          </Suspense>
        </section>
        <section
          className="maia-manifesto container"
          id="sobre"
          aria-labelledby="about-title"
          data-reveal
        >
          <div className="manifesto-picture">
            <Image
              src="/products/foto-100.jpeg"
              alt="Tênis Samba vinho e branco em uma composição de moda"
              fill
              sizes="(max-width: 700px) 100vw, 45vw"
            />
          </div>
          <div className="manifesto-copy">
            <span className="manifesto-mark" aria-hidden="true">
              m.
            </span>
            <p className="eyebrow">O UNIVERSO MAIA</p>
            <h2 id="about-title">
              Tendências passam.
              <br />
              <span>Seu estilo fica.</span>
            </h2>
            <p>
              Para os dias comuns. Para os planos inesperados.
              <br />
              Para todas as versões de você.
            </p>
            <a className="button button-light" href="#colecao">
              Encontre sua Maia{" "}
              <span className="round-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </section>
      </main>
      <footer className="footer container">
        <div className="footer-top">
          <a href="#inicio" className="footer-wordmark">
            maia<span>SHOES & BAGS</span>
          </a>
          <p>O próximo passo é seu.</p>
        </div>
        <div className="footer-bottom">
          <span>© Maia Shoes & Bags</span>
          <nav aria-label="Menu do rodapé">
            <a href="#colecao">Coleção</a>
            <Link href="/conta">Minha conta</Link>
            <a href="#inicio">Voltar ao topo ↑</a>
          </nav>
        </div>
      </footer>
      <ScrollReveal />
    </div>
  );
}
