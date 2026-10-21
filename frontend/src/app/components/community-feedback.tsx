"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  feedbackRequest,
  feedbackStatusLabel,
  type FeedbackKind,
  type Participant,
  type Participation,
  type PublicReviews,
} from "@/lib/feedback-api";

export default function CommunityFeedback() {
  const [reviews, setReviews] = useState<PublicReviews | null>(null);
  const [publicError, setPublicError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [user, setUser] = useState<Participant | null | undefined>();
  const [mine, setMine] = useState<Participation[]>([]);
  const [kind, setKind] = useState<FeedbackKind>("AVALIACAO");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    feedbackRequest<PublicReviews>("", { signal: controller.signal }).then(
      (result) => {
        if (!controller.signal.aborted) {
          setReviews(result);
          setPublicError(false);
        }
      },
      () => {
        if (!controller.signal.aborted) setPublicError(true);
      },
    );
    return () => controller.abort();
  }, [loadKey]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const account: Participant | null = response.ok
          ? await response.json()
          : null;
        if (controller.signal.aborted) return;
        setUser(account);
        if (account?.role === "CLIENTE") {
          const records = await feedbackRequest<Participation[]>("/mine", {
            signal: controller.signal,
          }).catch(() => null);
          if (!controller.signal.aborted && records) setMine(records);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null);
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");
    if (kind === "AVALIACAO" && (!rating || !consent)) {
      setFormError("Escolha uma nota e autorize a publicação da avaliação.");
      return;
    }
    setSending(true);
    try {
      const saved = await feedbackRequest<Participation>("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message: message.trim(),
          ...(kind === "AVALIACAO" ? { rating } : {}),
          publishConsent: kind === "AVALIACAO" && consent,
        }),
      });
      setMine((current) => [
        saved,
        ...current.filter((item) => item.kind !== saved.kind),
      ]);
      setMessage("");
      setRating(0);
      setConsent(false);
      setLoadKey((value) => value + 1);
      setNotice(
        kind === "AVALIACAO"
          ? "Recebemos sua avaliação! Ela aparecerá após a análise do administrador."
          : "Sugestão recebida! Ela será lida pela equipe e permanecerá privada.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar. Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="section-heading community-heading">
        <div>
          <p className="eyebrow">HISTÓRIAS REAIS. NOVAS POSSIBILIDADES.</p>
          <h2 id="community-title">
            Quem vive a Maia <em>tem voz.</em>
          </h2>
        </div>
        <p>Avaliações da comunidade e ideias para ir além.</p>
      </div>
      <div className="community-layout">
        <div className="community-stories">
          {publicError ? (
            <div className="community-empty">
              <p role="alert">As avaliações estão indisponíveis no momento.</p>
              <button
                type="button"
                className="text-link"
                onClick={() => setLoadKey((value) => value + 1)}
              >
                Tentar novamente ↗
              </button>
            </div>
          ) : !reviews ? (
            <p role="status">Carregando as histórias da comunidade…</p>
          ) : (
            <>
              {reviews.summary.count > 0 && (
                <div className="review-summary">
                  <strong>
                    {reviews.summary.average?.toFixed(1).replace(".", ",")}{" "}
                    <span aria-hidden="true">★</span>
                  </strong>
                  <span>
                    {reviews.summary.count}{" "}
                    {reviews.summary.count === 1
                      ? "avaliação publicada"
                      : "avaliações publicadas"}
                  </span>
                </div>
              )}
              {!reviews.items.length ? (
                <div className="community-empty">
                  <span className="community-quote" aria-hidden="true">
                    “
                  </span>
                  <h3>
                    A próxima história
                    <br />
                    pode ser a sua.
                  </h3>
                  <p>
                    Ainda não há avaliações publicadas. Compartilhe sua
                    experiência com a Maia e ajude outras pessoas a escolher.
                  </p>
                  <small>
                    Somente relatos enviados por clientes e aprovados pela
                    equipe aparecem aqui.
                  </small>
                </div>
              ) : (
                <div className="review-list">
                  {reviews.items.map((item) => (
                    <article className="review-card" key={item.id}>
                      <div
                        className="review-stars"
                        aria-label={`Nota ${item.rating} de 5`}
                      >
                        {"★".repeat(item.rating ?? 0)}
                        <span aria-hidden="true">
                          {"☆".repeat(5 - (item.rating ?? 0))}
                        </span>
                      </div>
                      <blockquote>{item.message}</blockquote>
                      <footer>
                        <span className="review-avatar" aria-hidden="true">
                          {item.authorName.slice(0, 1)}
                        </span>
                        <div>
                          <strong>{item.authorName}</strong>
                          <span>
                            Comunidade Maia ·{" "}
                            {new Date(item.updatedAt).toLocaleDateString(
                              "pt-BR",
                              { month: "long", year: "numeric" },
                            )}
                          </span>
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="participation-card">
          <p className="eyebrow">VAMOS CONSTRUIR JUNTOS</p>
          <h3>Seu olhar faz diferença.</h3>
          <p>Conte como foi sua experiência ou deixe uma ideia para a Maia.</p>
          {user === undefined ? (
            <p role="status">Verificando sua conta…</p>
          ) : user?.role === "ADMIN" ? (
            <div className="participation-access">
              <p>Gerencie as avaliações e leia as sugestões no painel.</p>
              <Link className="button" href="/admin/feedbacks">
                Moderar participações ↗
              </Link>
            </div>
          ) : !user ? (
            <div className="participation-access">
              <p>
                Entre na sua conta de cliente para participar. Sua avaliação
                será publicada somente após análise.
              </p>
              <Link className="button" href="/login">
                Entrar para participar ↗
              </Link>
              <Link className="text-link" href="/cadastro">
                Ainda não tenho conta ↗
              </Link>
            </div>
          ) : (
            <>
              <form className="feedback-form" onSubmit={submit}>
                <label>
                  O que você quer compartilhar?
                  <select
                    value={kind}
                    disabled={sending}
                    onChange={(event) => {
                      setKind(event.target.value as FeedbackKind);
                      setNotice("");
                      setFormError("");
                    }}
                  >
                    <option value="AVALIACAO">
                      Avaliar e recomendar a Maia
                    </option>
                    <option value="SUGESTAO">
                      Enviar uma sugestão privada
                    </option>
                  </select>
                </label>
                {kind === "AVALIACAO" && (
                  <fieldset className="feedback-rating">
                    <legend>Como você avalia sua experiência?</legend>
                    <div>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="rating"
                            value={value}
                            checked={rating === value}
                            required
                            disabled={sending}
                            onChange={() => setRating(value)}
                          />
                          <span
                            aria-hidden="true"
                            className={rating >= value ? "selected" : ""}
                          >
                            ★
                          </span>
                          <span className="sr-only">
                            {value} {value === 1 ? "estrela" : "estrelas"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <label>
                  {kind === "AVALIACAO" ? "Sua experiência" : "Sua sugestão"}
                  <textarea
                    required
                    minLength={20}
                    maxLength={1000}
                    rows={5}
                    value={message}
                    disabled={sending}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      kind === "AVALIACAO"
                        ? "O que você gostaria de contar para quem está conhecendo a Maia?"
                        : "O que podemos melhorar? Conte sua ideia para a equipe."
                    }
                  />
                </label>
                <span className="feedback-count">
                  20 a 1.000 caracteres · {message.length}/1.000
                </span>
                {kind === "AVALIACAO" ? (
                  <label className="feedback-consent">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      disabled={sending}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      Autorizo publicar meu primeiro nome, nota e relato após
                      análise. Não inclua dados pessoais ou de outras pessoas.
                    </span>
                  </label>
                ) : (
                  <p className="feedback-privacy">
                    Sua sugestão é privada e será acessível apenas à equipe
                    administradora.
                  </p>
                )}
                {mine.some((item) => item.kind === kind) && (
                  <p className="feedback-privacy">
                    Este envio substitui sua participação anterior deste tipo e
                    passa por nova análise.
                  </p>
                )}
                {formError && (
                  <p role="alert" className="feedback-error">
                    {formError}
                  </p>
                )}
                <button type="submit" className="button" disabled={sending}>
                  {sending
                    ? "Enviando…"
                    : kind === "AVALIACAO"
                      ? "Enviar avaliação ↗"
                      : "Enviar sugestão ↗"}
                </button>
              </form>
              {notice && (
                <p className="feedback-success" role="status">
                  {notice}
                </p>
              )}
              {mine.length > 0 && (
                <div className="my-participations">
                  <h4>Suas participações</h4>
                  {mine.map((item) => (
                    <p key={item.id}>
                      <span>
                        {item.kind === "AVALIACAO"
                          ? "Avaliação"
                          : "Sugestão privada"}
                      </span>
                      <strong>{feedbackStatusLabel[item.status]}</strong>
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
