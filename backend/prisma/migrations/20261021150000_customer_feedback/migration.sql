CREATE TYPE "FeedbackKind" AS ENUM ('AVALIACAO', 'SUGESTAO');
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDENTE', 'APROVADO', 'ARQUIVADO');
CREATE TABLE "Feedback" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "authorName" VARCHAR(100) NOT NULL,
  "kind" "FeedbackKind" NOT NULL,
  "message" VARCHAR(1000) NOT NULL,
  "rating" INTEGER,
  "publishConsent" BOOLEAN NOT NULL DEFAULT false,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDENTE',
  "moderatedById" INTEGER,
  "moderatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Feedback_rating_check" CHECK (("kind" = 'AVALIACAO' AND "rating" BETWEEN 1 AND 5 AND "rating" IS NOT NULL AND "publishConsent" = true) OR ("kind" = 'SUGESTAO' AND "rating" IS NULL AND "publishConsent" = false)),
  CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Feedback_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Feedback_userId_kind_key" ON "Feedback"("userId", "kind");
CREATE INDEX "Feedback_status_kind_updatedAt_idx" ON "Feedback"("status", "kind", "updatedAt");
