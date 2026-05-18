import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RICKED_EMAIL_FROM ?? "Ricked <noreply@ricked.app>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Ricked email",
    text: `Verify your Ricked email\n\nClick the link below to verify your account. It expires in 24 hours.\n\n${url}\n\nIf you didn't create a Ricked account, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0d3c54">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Verify your email</h1>
        <p style="font-size:15px;color:#4b5563;margin-bottom:24px">
          Click the button below to verify your Ricked account. This link expires in 24 hours.
        </p>
        <a href="${url}" style="display:inline-block;background:#0d3c54;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;text-decoration:none">
          Verify email
        </a>
        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          If you didn't create a Ricked account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendEmailChangeVerification(email: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email-change?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your new Ricked email address",
    text: `Confirm your new Ricked email address\n\nClick the link below to confirm this as your new email. It expires in 24 hours. Your current email stays active until you confirm.\n\n${url}\n\nIf you didn't request this change, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0d3c54">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Confirm your new email</h1>
        <p style="font-size:15px;color:#4b5563;margin-bottom:24px">
          Click below to confirm this as your new Ricked email address. This link expires in 24 hours.
          Your current email stays active until you confirm.
        </p>
        <a href="${url}" style="display:inline-block;background:#0d3c54;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;text-decoration:none">
          Confirm new email
        </a>
        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          If you didn't request this change, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Ricked password",
    text: `Reset your Ricked password\n\nSomeone requested a password reset for this account. Click the link below to choose a new password. It expires in 1 hour.\n\n${url}\n\nIf you didn't request this, ignore this email. Your password won't change.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0d3c54">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Reset your password</h1>
        <p style="font-size:15px;color:#4b5563;margin-bottom:24px">
          Someone requested a password reset for this Ricked account. Click below to choose a new password.
          This link expires in 1 hour.
        </p>
        <a href="${url}" style="display:inline-block;background:#0d3c54;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;text-decoration:none">
          Reset password
        </a>
        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
      </div>
    `,
  });
}
