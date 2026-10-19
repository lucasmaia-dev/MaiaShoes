-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('TENIS', 'BOLSAS', 'SEM_CATEGORIA');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'SEM_CATEGORIA';
