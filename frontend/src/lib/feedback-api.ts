export type FeedbackKind = "AVALIACAO" | "SUGESTAO";
export type FeedbackStatus = "PENDENTE" | "APROVADO" | "ARQUIVADO";
export type Participation = {
  id: number;
  authorName: string;
  kind: FeedbackKind;
  message: string;
  rating: number | null;
  status: FeedbackStatus;
  updatedAt: string;
};
export type PublicReviews = {
  items: Pick<
    Participation,
    "id" | "authorName" | "message" | "rating" | "updatedAt"
  >[];
  summary: { count: number; average: number | null };
};
export type Participant = { name: string; role: "ADMIN" | "CLIENTE" };
export const feedbackStatusLabel: Record<FeedbackStatus, string> = {
  PENDENTE: "Aguardando análise",
  APROVADO: "Publicada",
  ARQUIVADO: "Arquivada",
};

export async function feedbackRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  let response: Response;
  try {
    response = await fetch(`/api/feedback${path}`, {
      ...options,
      cache: "no-store",
      headers: { "X-MaiaShoes-Request": "1", ...options.headers },
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
    });
  } catch {
    throw new Error("Não foi possível conectar. Tente novamente em instantes.");
  }
  if (response.status === 401)
    throw new Error("Entre na sua conta para continuar.");
  if (response.status === 403)
    throw new Error("Sua conta não tem permissão para esta ação.");
  if (response.status === 429)
    throw new Error("Aguarde um minuto antes de enviar novamente.");
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      (response.status === 400 || response.status === 409) &&
        typeof error?.message === "string"
        ? error.message
        : "Não foi possível concluir. Confira os campos e tente novamente.",
    );
  }
  return response.json();
}
