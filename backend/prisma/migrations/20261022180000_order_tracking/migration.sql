CREATE TYPE "OrderFulfillmentStatus" AS ENUM ('AGUARDANDO_PAGAMENTO', 'PREPARANDO', 'SAIU_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA', 'CONCLUIDO');
ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" "OrderFulfillmentStatus" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO';
UPDATE "Order" SET "fulfillmentStatus" = 'PREPARANDO' WHERE "status" = 'PAGO';
ALTER TABLE "Order" ADD CONSTRAINT "Order_progress_requires_payment" CHECK ("status" = 'PAGO' OR "fulfillmentStatus" = 'AGUARDANDO_PAGAMENTO');
CREATE TABLE "OrderProgressEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderFulfillmentStatus" NOT NULL,
  "status" "OrderFulfillmentStatus" NOT NULL,
  "actorId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderProgressEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderProgressEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OrderProgressEvent_orderId_status_key" ON "OrderProgressEvent"("orderId", "status");
