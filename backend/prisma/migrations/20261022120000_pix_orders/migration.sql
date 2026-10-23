CREATE TYPE "OrderStatus" AS ENUM ('AGUARDANDO_CONFIRMACAO', 'AGUARDANDO_PAGAMENTO', 'PAGO');
CREATE TYPE "Fulfillment" AS ENUM ('RETIRADA', 'ENTREGA');
CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" UUID NOT NULL,
  "userId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "productName" VARCHAR(150) NOT NULL,
  "imageUrl" VARCHAR(255),
  "line" VARCHAR(10),
  "size" INTEGER,
  "quantity" INTEGER NOT NULL CHECK ("quantity" BETWEEN 1 AND 10),
  "unitPriceCents" INTEGER NOT NULL CHECK ("unitPriceCents" > 0),
  "shippingCents" INTEGER CHECK ("shippingCents" >= 0),
  "totalCents" INTEGER CHECK ("totalCents" > 0),
  "contact" VARCHAR(30) NOT NULL,
  "fulfillment" "Fulfillment" NOT NULL,
  "address" VARCHAR(500),
  "status" "OrderStatus" NOT NULL DEFAULT 'AGUARDANDO_CONFIRMACAO',
  "pixPayload" TEXT,
  "pixReceiver" VARCHAR(100),
  "confirmedById" INTEGER,
  "bankReference" VARCHAR(100),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Order_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_requestId_key" ON "Order"("requestId");
CREATE UNIQUE INDEX "Order_bankReference_key" ON "Order"("bankReference");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
