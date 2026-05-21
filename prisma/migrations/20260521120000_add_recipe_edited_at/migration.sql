-- AlterTable: add editedAt to Recipe
-- Nullable — null means never edited after creation.
-- Set explicitly in updateRecipe() only, not on publish or other status changes.
ALTER TABLE "Recipe" ADD COLUMN "editedAt" TIMESTAMP(3);
