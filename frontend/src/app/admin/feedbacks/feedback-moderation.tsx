"use client";

import { useEffect, useState } from "react";
import {
  feedbackRequest,
  feedbackStatusLabel,
  type FeedbackStatus,
  type Participation,
} from "@/lib/feedback-api";

export default function FeedbackModeration() {
  const [items, setItems] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadKey, setLoadKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FeedbackStatus | "TODAS">("PENDENTE");
  useEffect(() => {
    const controller = new AbortController();
    feedbackRequest<Participation[]>("/moderation", {
      signal: controller.signal,
    }).then(
      (result) => {
        if (!controller.signal.aborted) {
          setItems(result);
          setLoading(false);
          setError("");
        }
      },
      (reason: Error) => {
        if (!controller.signal.aborted) {
          setError(reason.message);
          setLoading(false);
        }
      },
    );
    return () => controller.abort();
  }, [loadKey]);
  async function moderate(item: Participation, status: FeedbackStatus) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const saved = await feedbackRequest<Participation>(`/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, updatedAt: item.updatedAt }),
      });
      setItems((current) =>
        current.map((record) => (record.id === saved.id ? saved : record)),
      );
      setNotice(
        status === "APROVADO"
          ? "Avaliação publicada na comunidade."
          : status === "ARQUIVADO"
            ? "Participação arquivada. Ela não aparece na loja."
            : "Participação devolvida para análise.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar.",
      );
    } finally {
      setBusyId(null);
    }
  }
  const visible = items.filter(
    (item) => filter === "TODAS" || item.status === filter,
  );
  return (
    <section className="feedback-admin" aria-label="Moderar participações">
      <div
        className="moderation-tabs"
        role="group"
        aria-label="Filtrar participações"
      >
        {(["PENDENTE", "APROVADO", "ARQUIVADO", "TODAS"] as const).map(
          (status) => (
            <button
              type="button"
              key={status}
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
            >
              {status === "TODAS"
                ? "Todas"
                : status === "APROVADO"
                  ? "Publicadas"
                  : status === "ARQUIVADO"
                    ? "Arquivadas"
                    : "Pendentes"}{" "}
              <small>
                {status === "TODAS"
                  ? items.length
                  : items.filter((item) => item.status === status).length}
              </small>
            </button>
          ),
        )}
      </div>
      {notice && (
        <p role="status" className="feedback-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="feedback-error">
          {error}{" "}
          <button
            type="button"
            onClick={() => setLoadKey((value) => value + 1)}
          >
            Recarregar
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Carregando as participações…</p>
      ) : !visible.length ? (
        <p className="community-empty">Nenhuma participação nesta seleção.</p>
      ) : (
        <div className="moderation-list">
          {visible.map((item) => (
            <article className="review-card" key={item.id}>
              <header>
                <strong>{item.authorName}</strong>
                <span>
                  {item.kind === "AVALIACAO"
                    ? `Avaliação · ${item.rating}/5`
                    : "Sugestão privada"}{" "}
                  · {feedbackStatusLabel[item.status]}
                </span>
              </header>
              <p className="moderation-message">{item.message}</p>
              <small>
                Atualizada em{" "}
                {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
              </small>
              <div className="moderation-actions">
                {item.kind === "AVALIACAO" && item.status !== "APROVADO" && (
                  <button
                    className="button"
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void moderate(item, "APROVADO")}
                  >
                    Aprovar e publicar
                  </button>
                )}
                {item.status !== "ARQUIVADO" && (
                  <button
                    className="outline-button"
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void moderate(item, "ARQUIVADO")}
                  >
                    Arquivar
                  </button>
                )}
                {item.status === "ARQUIVADO" && (
                  <button
                    className="outline-button"
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void moderate(item, "PENDENTE")}
                  >
                    Voltar para análise
                  </button>
                )}
                {busyId === item.id && <span role="status">Salvando…</span>}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="feedback-privacy">
        Últimas 100 participações. Sugestões nunca são publicadas. Ao editar uma
        avaliação, o cliente precisa aguardar uma nova aprovação.
      </p>
    </section>
  );
}
