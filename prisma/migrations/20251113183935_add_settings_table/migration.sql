-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "primaryColorLight" TEXT,
    "accentColorLight" TEXT,
    "backgroundColorLight" TEXT,
    "cardColorLight" TEXT,
    "headerColorLight" TEXT,
    "themeNameLight" TEXT NOT NULL DEFAULT 'Padrão',
    "primaryColorDark" TEXT,
    "accentColorDark" TEXT,
    "backgroundColorDark" TEXT,
    "cardColorDark" TEXT,
    "headerColorDark" TEXT,
    "themeNameDark" TEXT NOT NULL DEFAULT 'Padrão',
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyCnpj" TEXT,
    "companyPhone" TEXT,
    "customLogoSvg" TEXT,
    "paymentRates" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
