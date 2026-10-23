"use client";

import { useCallback, useEffect, useState } from "react";
import { currency } from "@/lib/catalog-filters";
import {
  ordersRequest,
  orderStatus,
  orderItems,
  type Order,
} from "@/lib/orders-api";
import { fulfillmentLabel, nextOrderProgress } from "@/lib/order-progress";
import OrderTracking from "../../pedidos/order-tracking";
import styles from "../../checkout/checkout.module.css";
import OrderProducts from "../../pedidos/order-products";

export default function OrderModeration() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const load = useCallback(async () => {
    try {
      setOrders(await ordersRequest<Order[]>("/moderation"));
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar pedidos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    ordersRequest<Order[]>("/moderation", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setOrders(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Falha ao carregar pedidos.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function confirm(
    event: React.SubmitEvent<HTMLFormElement>,
    order: Order,
  ) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ordersRequest(`/${order.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ bankReference: form.get("reference") }),
      });
      setMessage("Recebimento registrado. O pedido foi marcado como pago.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao confirmar o recebimento.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function advance(
    event: React.SubmitEvent<HTMLFormElement>,
    order: Order,
  ) {
    event.preventDefault();
    const next = nextOrderProgress(order);
    if (busy || !next) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ordersRequest(`/${order.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedStatus: order.fulfillmentStatus ?? "PREPARANDO",
          status: next.status,
        }),
      });
      setMessage(
        "Etapa atualizada. O cliente já pode acompanhar a nova situação no pedido.",
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar a etapa.",
      );
    } finally {
      setBusy(false);
    }
  }
  const shown = orders.filter((order) => {
    const matchStatus =
      filter === "TODOS" ||
      (filter === "PENDENTES" && order.status !== "PAGO") ||
      (filter === "ANDAMENTO" &&
        order.status === "PAGO" &&
        order.fulfillmentStatus !== "CONCLUIDO") ||
      (filter === "CONCLUIDOS" && order.fulfillmentStatus === "CONCLUIDO");
    const text = [
      order.id,
      order.user?.name,
      order.user?.email,
      order.contact,
      ...orderItems(order).map((item) => item.productName),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return (
      matchStatus && text.includes(search.trim().toLocaleLowerCase("pt-BR"))
    );
  });
  return (
    <>
      <div className={styles.adminFilters}>
        <label>
          Buscar pedido
          <input
            type="search"
            value={search}
            placeholder="Número, cliente, telefone ou produto"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Situação
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="TODOS">Todos os pedidos</option>
            <option value="PENDENTES">Aguardando pagamento</option>
            <option value="ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDOS">Concluídos</option>
          </select>
        </label>
      </div>
      <button
        className={styles.button}
        disabled={busy || loading}
        onClick={() => {
          setLoading(true);
          void load();
        }}
      >
        {loading ? "Carregando…" : "Atualizar pedidos"}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p role="status">{message}</p>
      {!loading && !orders.length && !error && (
        <p>Nenhum pedido recebido ainda.</p>
      )}
      {!loading && orders.length > 0 && (
        <p className={styles.hint}>
          Mostrando {shown.length} de {orders.length} pedidos carregados
          (últimos 100).{" "}
          {orders.filter((order) => order.status !== "PAGO").length} aguardando
          pagamento ·{" "}
          {
            orders.filter(
              (order) =>
                order.status === "PAGO" &&
                order.fulfillmentStatus !== "CONCLUIDO",
            ).length
          }{" "}
          em andamento ·{" "}
          {
            orders.filter((order) => order.fulfillmentStatus === "CONCLUIDO")
              .length
          }{" "}
          concluídos.
        </p>
      )}
      {!loading && orders.length > 0 && !shown.length && (
        <p>Nenhum pedido corresponde à busca e ao filtro.</p>
      )}
      {shown.map((order) => (
        <article key={order.id} className={styles.card}>
          <p className="eyebrow">PEDIDO {order.id.toUpperCase()}</p>
          <span className={styles.badge}>
            {order.status === "PAGO"
              ? fulfillmentLabel(order)
              : orderStatus[order.status]}
          </span>
          {order.status === "PAGO" && (
            <details className={styles.history}>
              <summary>Ver acompanhamento e datas</summary>
              <OrderTracking order={order} />
            </details>
          )}
          <OrderProducts order={order} />
          <p>
            {order.user?.name} · {order.user?.email ?? "Conta sem e-mail"} ·
            Telefone: {order.contact}
          </p>
          <p>
            {order.fulfillment === "A_COMBINAR"
              ? "Cliente precisa escolher como receber na página do pedido."
              : order.fulfillment === "RETIRADA"
                ? "Retirada gratuita · combinar endereço e horário pelo WhatsApp."
                : `Entrega em casa · ${order.address ?? "combinar endereço e horário pelo WhatsApp."}`}
          </p>
          {order.totalCents !== null && (
            <p>
              <strong>
                Total do Pix: {currency.format(order.totalCents / 100)}
              </strong>{" "}
              · Entrega no Pix:{" "}
              {currency.format((order.shippingCents ?? 0) / 100)}
            </p>
          )}
          {order.fulfillmentViaWhatsapp &&
            order.status !== "AGUARDANDO_CONFIRMACAO" && (
              <p className={styles.hint}>
                Pedido do fluxo anterior: a taxa de entrega não foi incluída na
                cobrança já emitida. Combine qualquer ajuste com o cliente.
              </p>
            )}
          {order.status === "AGUARDANDO_CONFIRMACAO" && (
            <p>
              O cliente pode escolher retirada ou entrega e gerar o Pix
              diretamente na página do pedido. Não é necessária aprovação de
              disponibilidade.
            </p>
          )}
          {order.status === "AGUARDANDO_PAGAMENTO" && (
            <form
              className={styles.form}
              onSubmit={(event) => void confirm(event, order)}
            >
              <label>
                Identificador da transação no extrato (EndToEndId)
                <input
                  name="reference"
                  required
                  minLength={6}
                  maxLength={100}
                  pattern="[A-Za-z0-9-]+"
                  placeholder="Identificador do Pix recebido"
                  disabled={busy}
                />
              </label>
              <label className={styles.check}>
                <input required type="checkbox" disabled={busy} />
                Consultei o extrato da conta e confirmei o recebimento do total
                deste Pix.
              </label>
              <button className={styles.button} disabled={busy}>
                Confirmar recebimento na conta
              </button>
            </form>
          )}
          {nextOrderProgress(order) && (
            <form
              className={styles.form}
              onSubmit={(event) => void advance(event, order)}
            >
              <label className={styles.check}>
                <input type="checkbox" required disabled={busy} />
                Confirmo que esta etapa já aconteceu e pode ser mostrada ao
                cliente.
              </label>
              <button type="submit" className={styles.button} disabled={busy}>
                {nextOrderProgress(order)!.label}
              </button>
            </form>
          )}
        </article>
      ))}
    </>
  );
}
