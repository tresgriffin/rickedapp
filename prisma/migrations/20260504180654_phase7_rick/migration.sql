-- CreateEnum
CREATE TYPE "DietaryRestriction" AS ENUM ('DAIRY_FREE', 'NUT_FREE', 'EGG_FREE', 'GLUTEN_FREE', 'SULFITE_FREE', 'VEGAN', 'VEGETARIAN');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dietaryNotes" TEXT,
ADD COLUMN     "dietaryPreferencesSet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dietaryRestrictions" "DietaryRestriction"[],
ADD COLUMN     "rickConversationsToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rickLastResetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "recipeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
