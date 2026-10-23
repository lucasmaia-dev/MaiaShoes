ALTER TABLE "Order" ADD COLUMN "subtotalCents" INTEGER CHECK ("subtotalCents" > 0);
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "productName" VARCHAR(150) NOT NULL,
  "imageUrl" VARCHAR(255),
  "line" VARCHAR(10),
  "size" INTEGER,
  "quantity" INTEGER NOT NULL CHECK ("quantity" BETWEEN 1 AND 10),
  "unitPriceCents" INTEGER NOT NULL CHECK ("unitPriceCents" > 0),
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OrderItem_orderId_position_key" ON "OrderItem"("orderId", "position");
UPDATE "Order" SET "subtotalCents" = "unitPriceCents" * "quantity";
INSERT INTO "OrderItem" ("id", "orderId", "position", "productId", "productName", "imageUrl", "line", "size", "quantity", "unitPriceCents")
SELECT 'legacy-' || "id", "id", 0, "productId", "productName", "imageUrl", "line", "size", "quantity", "unitPriceCents" FROM "Order";
