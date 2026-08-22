-- AlterEnum
ALTER TYPE "SiteStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "provisionError" TEXT;
