"use client";

import { useState } from "react";
import { ordersRequest, orderSubtotal, type Order } from "@/lib/orders-api";
import { orderWhatsappUrl, type ReceiptChoice } from "@/lib/order-whatsapp";
import { currency } from "@/lib/catalog-filters";
import styles from "../checkout/checkout.module.css";

export function PendingReceipt({
  order,
  updated,
}: {
  order: Order;
  updated: () => Promise<void>;
}) {
  const [choice, setChoice] = useState<ReceiptChoice | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice || busy) return;
    setBusy(true);
    setError("");
    try {
      await ordersRequest(`/${order.id}/fulfillment`, {
        method: "PATCH",
        body: JSON.stringify({ fulfillment: choice }),
      });
      await updated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o Pix. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.receipt} aria-labelledby="receipt-title">
      <h2 id="receipt-title">Escolha como receber</h2>
      <p>
        Sua peça está disponível. Escolha abaixo para liberar o Pix
        imediatamente.
      </p>
      <form className={styles.form} onSubmit={generate}>
        <fieldset disabled={busy}>
          <legend>Recebimento</legend>
          <label>
            <input
              type="radio"
              required
              name="receipt"
              checked={choice === "RETIRADA"}
              onChange={() => setChoice("RETIRADA")}
            />
            Retirar · gratuito
          </label>
          <label>
            <input
              type="radio"
              required
              name="receipt"
              checked={choice === "ENTREGA"}
              onChange={() => setChoice("ENTREGA")}
            />
            Receber em casa · R$ 15,00 incluídos no Pix
          </label>
        </fieldset>
        {choice && (
          <p>
            <strong>
              Total no Pix:{" "}
              {currency.format(
                (orderSubtotal(order) + (choice === "ENTREGA" ? 1500 : 0)) /
                  100,
              )}
            </strong>
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className={styles.button}
          disabled={!choice || busy}
        >
          {busy ? "Gerando Pix…" : "Gerar Pix com o total"}
        </button>
      </form>
    </section>
  );
}

export default function FulfillmentWhatsapp({ order }: { order: Order }) {
  const [declaredPaid, setDeclaredPaid] = useState(false);
  if (order.status === "AGUARDANDO_CONFIRMACAO") return null;
  const canArrange = order.status === "PAGO" || declaredPaid;
  const completed = order.fulfillmentStatus === "CONCLUIDO";
  const choices: ReceiptChoice[] =
    order.fulfillment === "A_COMBINAR"
      ? ["RETIRADA", "ENTREGA"]
      : [order.fulfillment];
  return (
    <section className={styles.receipt} aria-labelledby="whatsapp-title">
      <p className="eyebrow">DEPOIS DO PAGAMENTO</p>
      <h2 id="whatsapp-title">
        {completed
          ? "Atendimento do pedido"
          : "Combine os detalhes pelo WhatsApp"}
      </h2>
      <p>
        {completed
          ? "Seu pedido foi concluído. Se precisar de ajuda com esta compra, fale com a Maia pelo WhatsApp."
          : order.fulfillment === "ENTREGA" && !order.fulfillmentViaWhatsapp
            ? "A entrega já está incluída no total do Pix. Combine o endereço e o horário com a Maia."
            : order.fulfillment === "RETIRADA"
              ? "Sua retirada é gratuita. Combine o endereço e o horário com a Maia."
              : "Este pedido foi emitido no fluxo anterior. Combine os detalhes do recebimento com a Maia."}
      </p>
      {!canArrange ? (
        <>
          <button
            className={styles.button}
            type="button"
            onClick={() => setDeclaredPaid(true)}
          >
            Já fiz o Pix · continuar no WhatsApp
          </button>
          <p className={styles.hint}>
            A Maia confere o recebimento na conta. Este botão não confirma o
            pagamento.
          </p>
        </>
      ) : (
        <>
          {choices.map((choice) => {
            const url = orderWhatsappUrl(order.whatsappNumber, order, choice);
            return url ? (
              <p key={choice}>
                <a
                  className={styles.button}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {choices.length > 1
                    ? choice === "ENTREGA"
                      ? "Combinar entrega no WhatsApp"
                      : "Combinar retirada no WhatsApp"
                    : "Continuar no WhatsApp"}{" "}
                  ↗
                </a>
              </p>
            ) : null;
          })}
          {!order.whatsappNumber && (
            <p role="status">
              O atendimento está indisponível. Tente atualizar a página em
              instantes.
            </p>
          )}
          <p className={styles.hint}>
            O WhatsApp abre uma mensagem com o pedido para você revisar e
            enviar.
            {order.status !== "PAGO"
              ? " O pagamento continua aguardando conferência."
              : ""}
          </p>
        </>
      )}
    </section>
  );
}
