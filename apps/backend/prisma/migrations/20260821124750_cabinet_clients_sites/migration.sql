/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SitePlan" AS ENUM ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'PROVISIONING',
    "plan" "SitePlan" NOT NULL DEFAULT 'TRIAL',
    "frappeVersion" TEXT,
    "apps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_name_key" ON "Site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Site_domain_key" ON "Site"("domain");

-- CreateIndex
CREATE INDEX "Site_clientId_idx" ON "Site"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_clientId_idx" ON "EmailVerificationToken"("clientId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
