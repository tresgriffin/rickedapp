/**
 * Email infrastructure smoke test.
 * Run: npx tsx --env-file .env.local ./prisma/test_email.ts
 *
 * In Resend sandbox/dev mode, emails only deliver to verified addresses.
 * Add your email to the Resend dashboard's "Allowed emails" list first.
 * This sends one verification email and one password reset email.
 */
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const TEST_EMAIL = process.env.TEST_EMAIL_TO;

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not set in .env.local");
    process.exit(1);
  }

  if (!TEST_EMAIL) {
    console.error("❌ Set TEST_EMAIL_TO=your@email.com in .env.local to run this smoke test");
    process.exit(1);
  }

  console.log(`Sending to: ${TEST_EMAIL}`);
  console.log(`From: ${process.env.RICKED_EMAIL_FROM ?? "Ricked <noreply@ricked.app>"}`);
  console.log(`Base URL: ${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}\n`);

  try {
    await sendVerificationEmail(TEST_EMAIL, "smoke-test-token-verification");
    console.log("✓ Verification email sent");
  } catch (err) {
    console.error("❌ Verification email failed:", err);
  }

  try {
    await sendPasswordResetEmail(TEST_EMAIL, "smoke-test-token-reset");
    console.log("✓ Password reset email sent");
  } catch (err) {
    console.error("❌ Password reset email failed:", err);
  }

  console.log("\nCheck your inbox. If emails are missing, verify RESEND_API_KEY is valid");
  console.log("and that TEST_EMAIL_TO is on your Resend sandbox allowed-emails list.");
}

main();
