-- AlterTable
ALTER TABLE "public"."Workspace" ADD COLUMN     "squareAccessToken" TEXT,
ADD COLUMN     "squareEnvironment" TEXT DEFAULT 'sandbox',
ADD COLUMN     "squareLocationId" TEXT;
