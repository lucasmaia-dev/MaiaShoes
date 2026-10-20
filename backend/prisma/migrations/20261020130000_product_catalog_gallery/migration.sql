ALTER TABLE "products"
ADD COLUMN "catalogCode" VARCHAR(64),
ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE UNIQUE INDEX "products_catalogCode_key" ON "products"("catalogCode");
