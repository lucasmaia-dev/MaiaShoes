import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import ProductCatalog from "./components/product-catalog";
import { PUBLIC_CATEGORIES } from "@/lib/product-categories";

const categoryNotes = [
  "Conforto com personalidade.",
  "Elegância nos seus passos.",
  "Leveza para os seus dias.",
  "Detalhes que acompanham.",
];

export default function Home() {
  return (
    <div className="storefront">
      <a className="skip-link" href="#colecao">
        Ir para a coleção
      </a>
      <div className="announcement">
        MAIA SHOES & BAGS <span>Uma seleção feita para o seu ritmo.</span>
      </div>
      <header className="header container">
        <Link href="/" aria-label="Maia shoes — início" className="brand">
          <Image src="/logo-maia.jpg" width={62} height={62} alt="" priority />
          <span>
            maia<span className="brand-subtitle">SHOES & BAGS</span>
          </span>
        </Link>
        <nav aria-label="Menu principal">
          <a href="#categorias">Categorias</a>
          <a href="#colecao">Coleção</a>
          <a href="#sobre">A Maia</a>
        </nav>
        <Link href="/conta" className="account-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
          </svg>
          <span>Minha conta</span>
        </Link>
      </header>
      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">O EXTRAORDINÁRIO NO COTIDIANO</p>
            <h1 id="hero-title">
              Seu estilo.
              <br />
              Seu tempo.
              <br />
              <em>Seus passos.</em>
            </h1>
            <p className="hero-description">
              Peças que encontram o seu jeito de ser. Descubra novos favoritos e
              vista a liberdade de ser você.
            </p>
            <a className="button" href="#colecao">
              Encontre seu próximo favorito <span aria-hidden="true">↗</span>
            </a>
            <a className="hero-secondary" href="#categorias">
              Explore por categoria <span aria-hidden="true">↓</span>
            </a>
            <div className="hero-note">
              <span className="note-line" /> ESTILO É O QUE CAMINHA COM VOCÊ.
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-main-photo">
              <Image
                src="/products/foto-078.jpeg"
                alt="Tênis Samba branco com listras pretas em uma composição de moda"
                fill
                sizes="(max-width: 700px) 90vw, 48vw"
                priority
              />
              <span className="photo-label">OS CLÁSSICOS, DO SEU JEITO.</span>
            </div>
            <Link className="hero-detail" href="/?categoria=TENIS#colecao">
              <div>
                <Image
                  src="/products/foto-100.jpeg"
                  alt="Samba vinho e branco, visto nos pés"
                  fill
                  sizes="(max-width: 700px) 30vw, 15vw"
                />
              </div>
              <span>
                Um novo olhar.<span aria-hidden="true">↗</span>
              </span>
            </Link>
            <span className="hero-side-note" aria-hidden="true">
              MAIA — ESCOLHAS COM PERSONALIDADE
            </span>
          </div>
        </section>
        <section
          id="categorias"
          className="category-section container"
          aria-labelledby="categories-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">CADA MOMENTO, UMA ESCOLHA</p>
              <h2 id="categories-title">Encontre o seu universo.</h2>
            </div>
            <p>
              Um lugar para cada estilo.
              <br />
              Uma escolha com a sua cara.
            </p>
          </div>
          <nav className="category-grid" aria-label="Categorias de produtos">
            {PUBLIC_CATEGORIES.map((category, index) => (
              <Link
                className="category-tile"
                key={category.value}
                href={`/?categoria=${category.value}#colecao`}
              >
                <span className="category-number">0{index + 1}</span>
                <h3>{category.label}</h3>
                <p>{categoryNotes[index]}</p>
                <span className="category-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </nav>
        </section>
        <section
          id="colecao"
          className="collection container"
          aria-labelledby="collection-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">A SELEÇÃO MAIA</p>
              <h2 id="collection-title">
                Feitos para combinar
                <br />
                <em>com você.</em>
              </h2>
            </div>
            <p>
              Explore os detalhes.
              <br />
              Escolha no seu tempo.
            </p>
          </div>
          <Suspense
            fallback={
              <p className="catalog-message" role="status">
                Preparando a coleção…
              </p>
            }
          >
            <ProductCatalog />
          </Suspense>
        </section>
        <section id="sobre" className="about" aria-labelledby="about-title">
          <div className="about-inner container">
            <div className="about-photo">
              <Image
                src="/products/foto-087.jpeg"
                alt="Detalhes de um par de tênis em tons claros com solado caramelo"
                fill
                sizes="(max-width: 700px) 90vw, 40vw"
              />
            </div>
            <div className="about-copy">
              <p className="eyebrow">PRAZER, SOMOS A MAIA</p>
              <h2 id="about-title">
                A beleza está
                <br />
                em ser <em>você.</em>
              </h2>
              <p>
                Acreditamos nas escolhas que fazem sentido para a sua vida. No
                detalhe que transforma um look. Na peça que vira companhia para
                os seus próximos passos.
              </p>
              <p>
                Uma seleção de calçados e bolsas para expressar sua
                personalidade, todos os dias.
              </p>
              <a className="text-link" href="#colecao">
                Descubra a seleção <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer container">
        <div>
          <a className="footer-wordmark" href="#inicio">
            maia
          </a>
          <p>O seu jeito de caminhar pelo mundo.</p>
        </div>
        <nav aria-label="Menu do rodapé">
          <a href="#categorias">Categorias</a>
          <a href="#colecao">Coleção</a>
          <Link href="/conta">Minha conta</Link>
        </nav>
        <div className="footer-bottom">
          <span>© Maia Shoes & Bags</span>
          <a href="#inicio">Voltar ao início ↑</a>
        </div>
      </footer>
    </div>
  );
}
