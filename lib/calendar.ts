const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const mailbox = process.env.OUTLOOK_MAILBOX_USER;

async function getGraphToken(): Promise<string | null> {
  if (!tenantId || !clientId || !clientSecret) return null;

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    console.error("[calendar] failed to get Graph token", await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function createOutlookEvent(input: {
  subject: string;
  bodyText: string;
  startIso: string;
  durationMinutes?: number;
}): Promise<string | null> {
  const token = await getGraphToken();
  if (!token || !mailbox) {
    console.warn("[calendar] Outlook not configured — skipping event creation.", input);
    return null;
  }

  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + (input.durationMinutes ?? 15) * 60000);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: input.subject,
        body: { contentType: "Text", content: input.bodyText },
        start: { dateTime: start.toISOString(), timeZone: "Europe/London" },
        end: { dateTime: end.toISOString(), timeZone: "Europe/London" },
      }),
    }
  );

  if (!res.ok) {
    console.error("[calendar] failed to create event", await res.text());
    return null;
  }
  const data = await res.json();
  return data.id ?? null;
}
