/*
  Warnings:

  - You are about to drop the column `taggedBourbonId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `bourbonId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the `Bourbon` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `whiskeyId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bourbon" DROP CONSTRAINT "Bourbon_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_taggedBourbonId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_bourbonId_fkey";

-- DropIndex
DROP INDEX "Review_bourbonId_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "taggedBourbonId",
ADD COLUMN     "taggedWhiskeyId" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "bourbonId",
ADD COLUMN     "whiskeyId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Bourbon";

-- CreateTable
CREATE TABLE "Whiskey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" "BourbonCategory" NOT NULL DEFAULT 'BOURBON',
    "distillery" TEXT,
    "mashBill" TEXT,
    "proof" DOUBLE PRECISION,
    "ageYears" INTEGER,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL DEFAULT '/images/bottle-placeholder.svg',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Whiskey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Whiskey_name_idx" ON "Whiskey"("name");

-- CreateIndex
CREATE INDEX "Whiskey_brand_idx" ON "Whiskey"("brand");

-- CreateIndex
CREATE INDEX "Whiskey_category_idx" ON "Whiskey"("category");

-- CreateIndex
CREATE INDEX "Review_whiskeyId_idx" ON "Review"("whiskeyId");

-- AddForeignKey
ALTER TABLE "Whiskey" ADD CONSTRAINT "Whiskey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_whiskeyId_fkey" FOREIGN KEY ("whiskeyId") REFERENCES "Whiskey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_taggedWhiskeyId_fkey" FOREIGN KEY ("taggedWhiskeyId") REFERENCES "Whiskey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
