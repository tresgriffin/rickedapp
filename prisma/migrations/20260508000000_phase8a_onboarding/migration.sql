-- Phase 8a onboarding additions: age verification, handle picker,
-- whiskey interest, and password reset token.
-- Applied to dev via `prisma db push`; this file brings production in sync.

-- CreateEnum
CREATE TYPE "WhiskeyInterest" AS ENUM ('BOURBON', 'SCOTCH', 'RYE', 'JAPANESE', 'IRISH', 'NOT_SURE');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "dateOfBirth"     TIMESTAMP(3),
  ADD COLUMN "hasPickedHandle" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "whiskeyInterest" "WhiskeyInterest";

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expires"   TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
