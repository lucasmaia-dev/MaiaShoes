ALTER TYPE "Fulfillment" ADD VALUE 'A_COMBINAR';
ALTER TABLE "Order"
  ADD COLUMN "fulfillmentViaWhatsapp" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryFeeCents" INTEGER CHECK ("deliveryFeeCents" >= 0);
