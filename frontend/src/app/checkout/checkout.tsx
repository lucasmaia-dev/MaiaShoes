"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listProducts, type Product } from "@/lib/products-api";
import { currency } from "@/lib/catalog-filters";
import {
  FOOTWEAR_LINES,
  hasFootwearSizing,
  type FootwearLine,
} from "@/lib/product-sizing";
import { ordersRequest, OrdersApiError } from "@/lib/orders-api";
import styles from "./checkout.module.css";

export default function Checkout() {
  const query = useSearchParams();
  const productId = Number(query.get("produto"));
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [line, setLine] = useState<FootwearLine>("FEMININO");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<"" | "RETIRADA" | "ENTREGA">(
    "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const attempt = useRef<string | null>(null);
  const sending = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([listProducts(), fetch("/api/auth/me", { cache: "no-store" })])
      .then(([products, session]) => {
        if (!active) return;
        const found = products.find(
          (p) =>
            p.id === productId && p.imageUrl && p.category !== "SEM_CATEGORIA",
        );
        setProduct(found ?? null);
        setSignedIn(session.ok);
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível carregar o produto. Tente atualizar a página.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);
  if (loading) return <p role="status">Preparando seu pedido…</p>;
  if (!product)
    return (
      <div className={styles.empty}>
        <h1>Escolha sua próxima peça.</h1>
        {error && <p role="alert">{error}</p>}
        <Link href="/colecao">Voltar à coleção →</Link>
      </div>
    );
  const footwear = hasFootwearSizing(product.category);
  const sizes = FOOTWEAR_LINES.find((item) => item.value === line)!.sizes;

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !product) return;
    sending.current = true;
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    attempt.current ??= JSON.stringify({
      requestId: crypto.randomUUID(),
      productId: product.id,
      quantity,
      ...(footwear ? { line, size: Number(size) } : {}),
      fulfillment,
      contact: form.get("contact"),
    });
    try {
      const order = await ordersRequest<{ id: string }>("", {
        method: "POST",
        body: attempt.current,
      });
      router.push(`/pedidos/${order.id}`);
    } catch (err) {
      if (
        !recovering &&
        err instanceof OrdersApiError &&
        err.status >= 400 &&
        err.status < 500
      ) {
        attempt.current = null;
        setRecovering(false);
      } else setRecovering(true);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o pedido. Tente novamente.",
      );
      setBusy(false);
      sending.current = false;
    }
  }
  return (
    <>
      <div className={styles.intro}>
        <Link href="/colecao">← Continuar na coleção</Link>
        <p className="eyebrow">DO SEU JEITO, ATÉ O ÚLTIMO DETALHE</p>
        <h1>Seu próximo favorito.</h1>
        <p>
          Escolha como receber e pague com Pix. As peças da coleção estão
          disponíveis para compra.
        </p>
      </div>
      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.product}>
            <Image
              src={product.imageUrl!}
              alt={product.name}
              width={100}
              height={120}
            />
            <div>
              <h2>{product.name}</h2>
              <p>{currency.format(Number(product.price))} por unidade</p>
            </div>
          </div>
          {!signedIn ? (
            <>
              <p>
                Entre na sua conta para acompanhar seu pedido e pagar com Pix.
              </p>
              <div className={styles.actions}>
                <Link className={styles.button} href="/login">
                  Entrar na minha conta
                </Link>
                <Link href="/cadastro">Criar conta</Link>
              </div>
              <p className={styles.hint}>
                Depois de entrar, volte a esta página para concluir.
              </p>
            </>
          ) : (
            <form className={styles.form} onSubmit={submit}>
              <fieldset disabled={busy || recovering}>
                <legend>Sua escolha</legend>
                {footwear && (
                  <>
                    <label>
                      Linha
                      <select
                        value={line}
                        onChange={(e) => {
                          setLine(e.target.value as FootwearLine);
                          setSize("");
                        }}
                      >
                        <option value="FEMININO">Feminino</option>
                        <option value="MASCULINO">Masculino</option>
                      </select>
                    </label>
                    <label>
                      Numeração
                      <select
                        required
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                      >
                        <option value="">Selecione o tamanho</option>
                        {sizes.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label>
                  Quantidade
                  <input
                    required
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
                <label>
                  Telefone / WhatsApp
                  <input
                    name="contact"
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={10}
                    maxLength={30}
                    placeholder="(62) 99999-9999"
                  />
                </label>
              </fieldset>
              <fieldset disabled={busy || recovering}>
                <legend>Como quer receber?</legend>
                <label>
                  <input
                    type="radio"
                    required
                    name="fulfillment"
                    value="RETIRADA"
                    checked={fulfillment === "RETIRADA"}
                    onChange={() => setFulfillment("RETIRADA")}
                  />
                  Quero retirar · gratuito
                </label>
                <label>
                  <input
                    type="radio"
                    required
                    name="fulfillment"
                    value="ENTREGA"
                    checked={fulfillment === "ENTREGA"}
                    onChange={() => setFulfillment("ENTREGA")}
                  />
                  Quero receber em casa · R$ 15,00
                </label>
                <p className={styles.hint}>
                  A entrega é somada ao valor dos produtos no mesmo Pix. Depois
                  de pagar, combine endereço e horário pelo WhatsApp.
                </p>
              </fieldset>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button className={styles.button} disabled={busy} type="submit">
                {busy
                  ? "Gerando Pix…"
                  : recovering
                    ? "Recuperar pedido desta tentativa"
                    : "Continuar para pagar com Pix"}
              </button>
              {recovering && (
                <p className={styles.hint}>
                  A conexão falhou. Tente novamente para recuperar o mesmo
                  pedido com os dados originais, sem gerar outra cobrança.
                </p>
              )}
            </form>
          )}
        </section>
        <aside className={styles.card}>
          <p className="eyebrow">RESUMO DO PEDIDO</p>
          <h2>Quase seu.</h2>
          <dl className={styles.totals}>
            <div>
              <dt>Produtos ({quantity || 0})</dt>
              <dd>
                {currency.format(Number(product.price) * (quantity || 0))}
              </dd>
            </div>
            <div>
              <dt>Recebimento</dt>
              <dd>
                {!fulfillment
                  ? "Selecione uma opção"
                  : fulfillment === "RETIRADA"
                    ? "Retirada gratuita"
                    : "Entrega · R$ 15,00"}
              </dd>
            </div>
            <div>
              <dt>Total no Pix</dt>
              <dd>
                <strong>
                  {fulfillment
                    ? currency.format(
                        (Math.round(Number(product.price) * 100) *
                          (quantity || 0) +
                          (fulfillment === "ENTREGA" ? 1500 : 0)) /
                          100,
                      )
                    : "Escolha como receber"}
                </strong>
              </dd>
            </div>
          </dl>
          <h3>◇ Pagamento com Pix</h3>
          <p className={styles.hint}>
            O QR Code e o Pix copia e cola são liberados imediatamente. Na
            entrega, os R$ 15,00 já estão incluídos no total. Após pagar, toque
            em “Já fiz o Pix” para combinar os detalhes pelo WhatsApp.
          </p>
          <p className={styles.hint}>
            A confirmação do pagamento é feita pela Maia após conferir o
            recebimento na conta.
          </p>
        </aside>
      </div>
    </>
  );
}
