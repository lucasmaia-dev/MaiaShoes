import Image from "next/image";
import ProductCatalog from "./components/product-catalog";
import Link from "next/link";

function ProductArtwork({ bag = false }: { bag?: boolean }) {
  return bag ? (
    <svg viewBox="0 0 400 280" role="img" aria-label="Ilustração de bolsa">
      <ellipse cx="200" cy="245" rx="115" ry="12" fill="#000" opacity=".07" />
      <path d="M158 113V87c0-58 84-58 84 0v26" fill="none" stroke="currentColor" strokeWidth="12" />
      <path d="M119 101h162l20 132c-42 20-160 20-202 0z" fill="currentColor" />
      <path d="M124 117h152M151 123v98m98-98v98" stroke="#fff" opacity=".2" fill="none" />
      <rect x="188" y="140" width="24" height="16" rx="3" fill="#b8aa8c" />
    </svg>
  ) : (
    <svg viewBox="0 0 400 280" role="img" aria-label="Ilustração de tênis">
      <ellipse cx="200" cy="234" rx="145" ry="13" fill="#000" opacity=".07" />
      <path d="M65 177l21-78 37 18 38-12 49 47 67 22 54 14q22 9 16 31H64q-15-22 1-42" fill="currentColor" />
      <path d="M77 176l22-48 27 13 28-14 48 45 77 21" fill="none" stroke="#fff" strokeWidth="18" opacity=".65" />
      <path d="M173 144l31-11m-18 23 31-11m-16 24 31-11" stroke="#fdfcf9" strokeWidth="7" strokeLinecap="round" />
      <path d="M58 206q147 18 290-4v24q-141 22-289 0z" fill="#faf9f6" stroke="#bbb8b0" strokeWidth="2" />
      <path d="M69 220h267" stroke="#d7d4ce" strokeWidth="2" strokeDasharray="5 4" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <div className="announcement">MAIA SHOES & BAGS <span>·</span> Cada detalhe, um pouco de você.</div>
      <header className="header container">
        <a href="#inicio" aria-label="MaiaShoes — início" className="brand"><Image src="/logo-maia.jpg" width={76} height={76} alt="Maia shoes" priority /></a>
        <nav aria-label="Menu principal"><a href="#colecao">Coleção</a><a href="#sobre">Nossa essência</a><Link href="/conta">Minha conta</Link></nav>
        <a href="#colecao" className="header-link">Encontre seu próximo favorito ↗</a>
      </header>
      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">LEVEZA EM CADA ESCOLHA</p>
            <h1 id="hero-title">Seu estilo.<br />Seu caminho.<br /><em>Sua Maia.</em></h1>
            <p className="hero-description">Calçados e bolsas para acompanhar quem você é — nos pequenos momentos e nos grandes passos.</p>
            <a className="button" href="#colecao">Explore a coleção <span aria-hidden="true">↗</span></a>
            <div className="hero-footnote"><span /> ESSENCIAIS PARA O SEU DIA A DIA</div>
          </div>
          <div className="hero-art">
            <span className="art-caption">A beleza de ser você.</span><span className="art-monogram" aria-hidden="true">M</span>
            <div className="hero-shoe"><ProductArtwork /></div>
            <div className="art-bottom"><span>MAIA ESSENTIALS</span><span>01 / 03</span></div>
          </div>
        </section>
        <div className="values container"><span>Estilo que acompanha você</span><span>Detalhes que fazem diferença</span><span>Escolhas com personalidade</span></div>
        <section id="colecao" className="collection container" aria-labelledby="collection-title">
          <div className="section-heading"><div><p className="eyebrow">ESCOLHIDOS PARA VOCÊ</p><h2 id="collection-title">Seus próximos favoritos</h2></div><p>O detalhe que faltava no seu dia.</p></div>
          <ProductCatalog />
        </section>
        <section id="sobre" className="about container"><p className="eyebrow">NOSSA ESSÊNCIA</p><h2>Mais do que vestir.<br /><em>É se reconhecer.</em></h2><p>A Maia nasce do carinho pelos detalhes. Queremos fazer parte das suas escolhas com peças que combinam com a sua rotina, sua personalidade e seus próximos passos.</p><span className="about-signature">Maia shoes & bags</span></section>
      </main>
      <footer className="footer container"><span>MAIA SHOES & BAGS</span><p>Feito para acompanhar você.</p><a href="#inicio">Voltar ao início ↑</a></footer>
    </>
  );
}
