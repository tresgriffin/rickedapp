-- AlterTable: add pending email change fields to User
ALTER TABLE "User"
  ADD COLUMN "pendingEmail"            TEXT,
  ADD COLUMN "pendingEmailRequestedAt" TIMESTAMP(3);
