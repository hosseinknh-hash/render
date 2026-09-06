import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, body: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping send. Would have sent:", {
      to,
      subject,
      body,
    });
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    text: body,
  });
}
