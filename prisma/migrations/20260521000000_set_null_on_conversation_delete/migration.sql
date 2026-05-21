-- AlterTable: Recipe.sourceConversationId FK — change to ON DELETE SET NULL
-- When a Conversation is deleted, recipes that were generated from it keep their
-- data but lose the conversation reference (sourceConversationId becomes null).
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS "Recipe_sourceConversationId_fkey";

ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_sourceConversationId_fkey"
  FOREIGN KEY ("sourceConversationId")
  REFERENCES "Conversation"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
