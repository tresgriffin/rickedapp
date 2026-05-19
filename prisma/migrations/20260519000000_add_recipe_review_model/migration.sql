-- CreateTable
CREATE TABLE "RecipeReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeReview_userId_recipeId_key" ON "RecipeReview"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "RecipeReview_recipeId_status_createdAt_idx" ON "RecipeReview"("recipeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RecipeReview_userId_idx" ON "RecipeReview"("userId");

-- AddForeignKey
ALTER TABLE "RecipeReview" ADD CONSTRAINT "RecipeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeReview" ADD CONSTRAINT "RecipeReview_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
