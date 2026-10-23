"use client";

import Image from "next/image";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { currency } from "@/lib/catalog-filters";
import {
  orderStatus,
  ordersRequest,
  orderSubtotal,
  type Order,
} from "@/lib/orders-api";
import styles from "../checkout/checkout.module.css";
import OrderProducts from "./order-products";
import FulfillmentWhatsapp, { PendingReceipt } from "./fulfillment-whatsapp";
import OrderTracking from "./order-tracking";
import { fulfillmentLabel } from "@/lib/order-progress";

export default function Orders({ id }: { id?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const result = id
        ? [await ordersRequest<Order>(`/${id}`)]
        : await ordersRequest<Order[]>();
      setError("");
      setOrders(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os pedidos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    const pending = id
      ? ordersRequest<Order>(`/${id}`, { signal: controller.signal }).then(
          (order) => [order],
        )
      : ordersRequest<Order[]>("", { signal: controller.signal });
    pending
      .then((result) => {
        if (!controller.signal.aborted) {
          setOrders(result);
          setError("");
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os pedidos.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);
  const completed = orders[0]?.fulfillmentStatus === "CONCLUIDO";
  useEffect(() => {
    if (!id || completed) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [id, completed, load]);
  return (
    <>
      <div className={styles.intro}>
        <Link href="/conta">← Minha conta</Link>
        <h1>{id ? "Sua escolha Maia." : "Meus pedidos"}</h1>
        <p>Pague com Pix e acompanhe seu pedido.</p>
        {id && !completed && (
          <p className={styles.hint}>
            A situação é atualizada a cada 30 segundos enquanto esta página
            estiver aberta.
          </p>
        )}
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error} <Link href="/login">Entrar na conta</Link>
        </div>
      )}
      <button
        className={styles.button}
        onClick={() => {
          setRefreshing(true);
          void load();
        }}
        disabled={refreshing || loading}
      >
        {refreshing || loading ? "Atualizando…" : "Atualizar situação"}
      </button>
      {loading ? (
        <p role="status">Carregando pedidos…</p>
      ) : !orders.length && !error ? (
        <p className={styles.empty}>
          Você ainda não tem pedidos.{" "}
          <Link href="/colecao">Explorar coleção →</Link>
        </p>
      ) : null}
      {orders.map((order) => (
        <article
          className={styles.card}
          key={order.id}
          style={{ marginTop: 24 }}
        >
          <p className="eyebrow">PEDIDO {order.id.toUpperCase()}</p>
          <p className={styles.badge}>
            {order.status === "PAGO"
              ? fulfillmentLabel(order)
              : orderStatus[order.status]}
          </p>
          {id && <OrderTracking order={order} />}
          <OrderProducts order={order} />
          <dl className={styles.totals}>
            <div>
              <dt>Produtos</dt>
              <dd>{currency.format(orderSubtotal(order) / 100)}</dd>
            </div>
            <div>
              <dt>
                {order.fulfillmentViaWhatsapp
                  ? "Recebimento"
                  : order.fulfillment === "RETIRADA"
                    ? "Retirada combinada"
                    : "Frete"}
              </dt>
              <dd>
                {order.fulfillmentViaWhatsapp
                  ? order.fulfillment === "A_COMBINAR"
                    ? "Escolha abaixo para gerar o Pix"
                    : order.fulfillment === "RETIRADA"
                      ? "Retirada gratuita"
                      : "Entrega própria"
                  : order.shippingCents === null
                    ? "A confirmar"
                    : currency.format(order.shippingCents / 100)}
              </dd>
            </div>
            <div>
              <dt>
                {order.fulfillmentViaWhatsapp ? "Pix dos produtos" : "Total"}
              </dt>
              <dd>
                <strong>
                  {order.totalCents === null
                    ? "Escolha como receber para calcular o total"
                    : currency.format(order.totalCents / 100)}
                </strong>
              </dd>
            </div>
          </dl>
          {order.fulfillmentViaWhatsapp &&
            order.status !== "AGUARDANDO_CONFIRMACAO" && (
              <p className={styles.hint}>
                Retirada gratuita ou entrega própria por{" "}
                {currency.format((order.deliveryFeeCents ?? 1500) / 100)}, paga
                separadamente. A taxa de entrega não está incluída no Pix dos
                produtos.
              </p>
            )}
          {order.address && <p>Entrega: {order.address}</p>}
          <p className={styles.hint}>Contato: {order.contact}</p>
          {id && order.status === "AGUARDANDO_CONFIRMACAO" && (
            <PendingReceipt key={order.id} order={order} updated={load} />
          )}
          {order.status === "PAGO" &&
            order.fulfillmentStatus !== "CONCLUIDO" && (
              <p role="status">
                Recebimento conferido pela Maia.{" "}
                {order.fulfillmentViaWhatsapp
                  ? "Escolha como receber e combine os detalhes pelo WhatsApp."
                  : order.fulfillment === "ENTREGA"
                    ? "Vamos combinar o envio pelo contato informado."
                    : "Vamos combinar sua retirada pelo contato informado."}
              </p>
            )}
          {id &&
            order.status === "AGUARDANDO_PAGAMENTO" &&
            order.pixPayload && (
              <section aria-label="Pagar com Pix">
                <h2>Pague com Pix</h2>
                <p>
                  Recebedor: <strong>{order.pixReceiver}</strong>. Confira o
                  titular e o valor no aplicativo do seu banco antes de
                  confirmar.
                </p>
                {/* QR gerado pela própria API, sem enviar dados de pagamento a serviços de imagem. */}
                {order.qrCode && (
                  <Image
                    unoptimized
                    className={styles.qr}
                    src={order.qrCode}
                    width={320}
                    height={320}
                    alt="QR Code Pix deste pedido"
                  />
                )}
                <label htmlFor="pix-code">Pix copia e cola</label>
                <textarea
                  id="pix-code"
                  className={styles.code}
                  readOnly
                  value={order.pixPayload}
                  onFocus={(e) => e.target.select()}
                />
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(order.pixPayload!);
                        setCopyMessage("Código Pix copiado.");
                      } catch {
                        setCopyMessage(
                          "Selecione e copie o código no campo acima.",
                        );
                      }
                    }}
                  >
                    Copiar código Pix
                  </button>
                  <span role="status">{copyMessage}</span>
                </div>
                <p className={styles.hint}>
                  Depois de pagar, toque em “Já fiz o Pix” para combinar os
                  detalhes pelo WhatsApp. Para acompanhar a conferência, use{" "}
                  “Atualizar situação”. Copiar o código ou voltar do banco não
                  confirma o pagamento. Se já pagou, não pague novamente.
                </p>
              </section>
            )}
          {id && <FulfillmentWhatsapp key={order.id} order={order} />}
          {!id && (
            <Link className={styles.button} href={`/pedidos/${order.id}`}>
              Ver pedido{" "}
              {order.status === "AGUARDANDO_PAGAMENTO" ? "e pagar com Pix" : ""}{" "}
              →
            </Link>
          )}
        </article>
      ))}
    </>
  );
}
