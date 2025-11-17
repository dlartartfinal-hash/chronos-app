/*
  Warnings:

  - You are about to drop the column `status` on the `Referral` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "referredBy" TEXT;

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referralId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referredUserEmail" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralCommission_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredUsers" INTEGER NOT NULL DEFAULT 0,
    "commissionEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Referral" ("commissionEarned", "createdAt", "id", "referralCode", "referredUsers", "updatedAt", "userId") SELECT "commissionEarned", "createdAt", "id", "referralCode", "referredUsers", "updatedAt", "userId" FROM "Referral";
DROP TABLE "Referral";
ALTER TABLE "new_Referral" RENAME TO "Referral";
CREATE UNIQUE INDEX "Referral_userId_key" ON "Referral"("userId");
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");
CREATE INDEX "Referral_userId_idx" ON "Referral"("userId");
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReferralCommission_referralId_idx" ON "ReferralCommission"("referralId");

-- CreateIndex
CREATE INDEX "ReferralCommission_referredUserId_idx" ON "ReferralCommission"("referredUserId");
