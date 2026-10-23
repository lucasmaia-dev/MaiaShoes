"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { cartKey, finalizeCartItems, type CartItem } from "@/lib/cart-data";
import {
  FOOTWEAR_LINES,
  hasFootwearSizing,
  type FootwearLine,
} from "@/lib/product-sizing";
import { listProducts, type Product } from "@/lib/products-api";
import { ordersRequest, OrdersApiError } from "@/lib/orders-api";
import { currency } from "@/lib/catalog-filters";
import styles from "../checkout/checkout.module.css";

export default function Cart() {
  const cart = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [fulfillment, setFulfillment] = useState<"" | "RETIRADA" | "ENTREGA">(
    "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [sizing, setSizing] = useState<
    Record<string, Pick<CartItem, "line" | "size">>
  >({});
  const attemptSources = useRef<CartItem[]>([]);
  const attempt = useRef<{
    requestId: string;
    items: CartItem[];
    fulfillment: "RETIRADA" | "ENTREGA";
    contact: string;
  } | null>(null);
  const sending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listProducts(controller.signal),
      fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }),
    ])
      .then(([items, session]) => {
        if (!controller.signal.aborted) {
          setProducts(items);
          setSignedIn(session.ok);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Não foi possível atualizar o catálogo. Atualize a página para tentar novamente.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const rows = cart.items.map((item) => ({
    item,
    product: products.find(
      (p) =>
        p.id === item.productId && p.imageUrl && p.category !== "SEM_CATEGORIA",
    ),
  }));
  const unavailable = rows.some((row) => !row.product);
  const subtotal = rows.reduce(
    (sum, row) =>
      sum +
      (row.product
        ? Math.round(Number(row.product.price) * 100) * row.item.quantity
        : 0),
    0,
  );
  async function checkout(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || unavailable || !fulfillment || !cart.items.length)
      return;
    const form = new FormData(event.currentTarget);
    if (!attempt.current) {
      try {
        const items = finalizeCartItems(
          cart.items,
          rows
            .filter(
              (row) => row.product && hasFootwearSizing(row.product.category),
            )
            .map((row) => row.item.productId),
          sizing,
        );
        attemptSources.current = cart.items.map((item) => ({ ...item }));
        attempt.current = {
          requestId: crypto.randomUUID(),
          items,
          fulfillment,
          contact: String(form.get("contact") ?? ""),
        };
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Confira as numerações antes de pagar.",
        );
        return;
      }
    }
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await ordersRequest<{ id: string }>("/cart", {
        method: "POST",
        body: JSON.stringify(attempt.current),
      });
      setSubmitted(true);
      cart.purchased(attemptSources.current);
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
          : "Não foi possível criar seu pedido. Tente novamente.",
      );
      sending.current = false;
      setBusy(false);
    }
  }
  if (!cart.ready || loading)
    return <p role="status">Preparando seu carrinho…</p>;
  if (submitted) return <p role="status">Pedido criado. Abrindo seu Pix…</p>;
  return (
    <>
      <div className={styles.intro}>
        <Link href="/colecao">← Continuar comprando</Link>
        <p className="eyebrow">SUAS ESCOLHAS MAIA</p>
        <h1>Meu carrinho</h1>
        <p>
          {cart.count}{" "}
          {cart.count === 1 ? "peça escolhida" : "peças escolhidas"}. Um pedido,
          um Pix, do seu jeito.
        </p>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!cart.items.length ? (
        <section className={styles.card}>
          <h2>Seu próximo favorito espera por você.</h2>
          <p>
            Adicione suas peças favoritas. A numeração dos calçados é escolhida
            ao finalizar a compra.
          </p>
          <Link className={styles.button} href="/colecao">
            Explorar coleção →
          </Link>
        </section>
      ) : (
        <div className={styles.grid}>
          <section aria-label="Peças no carrinho">
            <fieldset
              className={styles.cartItems}
              disabled={busy || recovering}
            >
              {rows.map(({ item, product }) => (
                <article className={styles.card} key={cartKey(item)}>
                  <div className={styles.product}>
                    {product?.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={96}
                        height={120}
                      />
                    )}
                    <div>
                      <h2>{product?.name ?? "Peça indisponível"}</h2>
                      {item.size && (
                        <p>
                          {item.line === "FEMININO" ? "Feminino" : "Masculino"}{" "}
                          · tamanho {item.size}
                        </p>
                      )}
                      {!item.size &&
                        product &&
                        hasFootwearSizing(product.category) && (
                          <p className={styles.hint}>
                            Numeração na finalização
                          </p>
                        )}
                      {product ? (
                        <p>
                          {currency.format(Number(product.price))} por unidade
                        </p>
                      ) : (
                        <p className={styles.hint}>
                          Remova esta peça para continuar.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.cartRow}>
                    <label>
                      Quantidade{" "}
                      <select
                        aria-label={`Quantidade de ${product?.name ?? "peça"}${item.size ? ` tamanho ${item.size}` : ""}`}
                        value={item.quantity}
                        onChange={(e) =>
                          cart.update(cartKey(item), Number(e.target.value))
                        }
                      >
                        {Array.from({ length: 10 }, (_, i) => (
                          <option value={i + 1} key={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    {product && (
                      <strong>
                        {currency.format(
                          (Math.round(Number(product.price) * 100) *
                            item.quantity) /
                            100,
                        )}
                      </strong>
                    )}
                    <button
                      className={styles.remove}
                      type="button"
                      onClick={() => cart.remove(cartKey(item))}
                      aria-label={`Remover ${product?.name ?? "peça"}${item.size ? ` tamanho ${item.size}` : ""}`}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </fieldset>
            <p className={styles.hint}>
              As escolhas ficam salvas neste navegador. Os preços exibidos são
              atualizados com o catálogo.
            </p>
          </section>
          <aside className={styles.card}>
            <p className="eyebrow">FINALIZAR COMPRA</p>
            <h2>Suas peças, juntas.</h2>
            <dl className={styles.totals}>
              <div>
                <dt>Produtos ({cart.count})</dt>
                <dd>{currency.format(subtotal / 100)}</dd>
              </div>
              <div>
                <dt>
                  {fulfillment === "ENTREGA" ? "Entrega em casa" : "Retirada"}
                </dt>
                <dd>
                  {!fulfillment
                    ? "Escolha abaixo"
                    : fulfillment === "ENTREGA"
                      ? "R$ 15,00"
                      : "Gratuita"}
                </dd>
              </div>
              <div>
                <dt>Total no Pix</dt>
                <dd>
                  <strong>
                    {!fulfillment || unavailable
                      ? "Revise suas opções"
                      : currency.format(
                          (subtotal + (fulfillment === "ENTREGA" ? 1500 : 0)) /
                            100,
                        )}
                  </strong>
                </dd>
              </div>
            </dl>
            {!signedIn ? (
              <>
                <p>
                  Entre na sua conta para finalizar. Seu carrinho fica guardado.
                </p>
                <div className={styles.actions}>
                  <Link className={styles.button} href="/login?next=/carrinho">
                    Entrar e continuar
                  </Link>
                  <Link href="/cadastro?next=/carrinho">Criar conta</Link>
                </div>
              </>
            ) : (
              <>
                <form className={styles.form} onSubmit={checkout}>
                  {rows.some(
                    (row) =>
                      row.product && hasFootwearSizing(row.product.category),
                  ) && (
                    <fieldset disabled={busy || recovering || unavailable}>
                      <legend>
                        Numeração dos calçados · obrigatório para pagar
                      </legend>
                      {rows
                        .filter(
                          (row) =>
                            row.product &&
                            hasFootwearSizing(row.product.category),
                        )
                        .map(({ item, product }) => {
                          const key = cartKey(item);
                          const selected = sizing[key] ?? {
                            line: item.line ?? "FEMININO",
                            size: item.size,
                          };
                          const sizes = FOOTWEAR_LINES.find(
                            (entry) =>
                              entry.value === (selected.line ?? "FEMININO"),
                          )!.sizes;
                          return (
                            <div key={key}>
                              <p>
                                <strong>{product!.name}</strong> ·{" "}
                                {item.quantity} unidade(s)
                                {item.size
                                  ? ` · seleção original ${item.size}`
                                  : ""}
                              </p>
                              <label>
                                Linha de {product!.name}
                                <select
                                  required
                                  value={selected.line ?? "FEMININO"}
                                  onChange={(event) =>
                                    setSizing((current) => ({
                                      ...current,
                                      [key]: {
                                        line: event.target
                                          .value as FootwearLine,
                                        size: undefined,
                                      },
                                    }))
                                  }
                                >
                                  <option value="FEMININO">Feminino</option>
                                  <option value="MASCULINO">Masculino</option>
                                </select>
                              </label>
                              <label>
                                Numeração de {product!.name}
                                <select
                                  required
                                  value={selected.size ?? ""}
                                  onChange={(event) =>
                                    setSizing((current) => ({
                                      ...current,
                                      [key]: {
                                        line: selected.line ?? "FEMININO",
                                        size: event.target.value
                                          ? Number(event.target.value)
                                          : undefined,
                                      },
                                    }))
                                  }
                                >
                                  <option value="">Selecione o tamanho</option>
                                  {sizes.map((number) => (
                                    <option value={number} key={number}>
                                      {number}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          );
                        })}
                    </fieldset>
                  )}
                  <fieldset disabled={busy || recovering || unavailable}>
                    <legend>Como quer receber?</legend>
                    <label>
                      <input
                        type="radio"
                        required
                        name="fulfillment"
                        checked={fulfillment === "RETIRADA"}
                        onChange={() => setFulfillment("RETIRADA")}
                      />
                      Retirada gratuita
                    </label>
                    <label>
                      <input
                        type="radio"
                        required
                        name="fulfillment"
                        checked={fulfillment === "ENTREGA"}
                        onChange={() => setFulfillment("ENTREGA")}
                      />
                      Entrega em casa · R$ 15,00 por pedido
                    </label>
                  </fieldset>
                  <label>
                    Telefone / WhatsApp
                    <input
                      type="tel"
                      name="contact"
                      autoComplete="tel"
                      required
                      minLength={10}
                      maxLength={30}
                      disabled={busy || recovering}
                      placeholder="(62) 99999-9999"
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.button}
                    disabled={busy || unavailable || !fulfillment}
                  >
                    {busy
                      ? "Gerando seu Pix…"
                      : recovering
                        ? "Recuperar pedido desta tentativa"
                        : "Finalizar e pagar com Pix"}
                  </button>
                </form>
                {recovering && (
                  <p className={styles.hint}>
                    A conexão falhou. Tente novamente para recuperar o mesmo
                    pedido com as peças e o recebimento originais, sem gerar
                    outra cobrança.
                  </p>
                )}
              </>
            )}
            <p className={styles.hint}>
              A entrega é cobrada uma única vez, mesmo com várias peças. O Pix é
              liberado na hora; depois de pagar, combine os detalhes pelo
              WhatsApp.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
