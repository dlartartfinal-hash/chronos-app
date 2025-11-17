/*
  Warnings:

  - You are about to drop the column `itemName` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalCents` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPriceCents` on the `SaleItem` table. All the data in the column will be lost.
  - Added the required column `subtotalCents` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendedor` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPriceCents` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceCents` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "collaboratorId" TEXT,
    "vendedor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Concluída',
    "totalCents" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "feesCents" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL,
    "installments" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("collaboratorId", "createdAt", "customerId", "id", "paymentMethod", "totalCents", "userId") SELECT "collaboratorId", "createdAt", "customerId", "id", "paymentMethod", "totalCents", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE TABLE "new_SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productVariationId" TEXT,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "originalPriceCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "promotionId" TEXT,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productVariationId_fkey" FOREIGN KEY ("productVariationId") REFERENCES "ProductVariation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("id", "productId", "productVariationId", "quantity", "saleId", "serviceId") SELECT "id", "productId", "productVariationId", "quantity", "saleId", "serviceId" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
