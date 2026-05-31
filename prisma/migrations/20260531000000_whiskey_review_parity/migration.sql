-- Make body optional (parity with RecipeReview.body String? @db.Text)
ALTER TABLE "Review" ALTER COLUMN "body" DROP NOT NULL;

-- One review per user per bottle (parity with RecipeReview @@unique([userId, recipeId]))
-- Safe: confirmed 0 duplicate (userId, whiskeyId) pairs in production before applying.
CREATE UNIQUE INDEX "Review_userId_whiskeyId_key" ON "Review"("userId", "whiskeyId");
