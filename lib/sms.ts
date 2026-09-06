import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSms(to: string, body: string) {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn("[sms] Twilio not configured — skipping send. Would have sent:", { to, body });
    return;
  }
  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
    body,
  });
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  if (!authToken) return true; // not configured — allow through in dev
  if (!signature) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
