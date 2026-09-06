import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export interface OutreachDraft {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
}

export async function draftOutreach(lead: {
  name: string;
  details?: string | null;
  source: string;
}): Promise<OutreachDraft> {
  const prompt = `You are the lead-response assistant for a premium German kitchen showroom (Kutchenhaus / Nobilia kitchens, UK). A new inquiry just came in. Write a fast, warm, personalised first-touch email and SMS that references the specific details the lead gave, and drives them to book a short call with our designer.

Lead name: ${lead.name}
Lead source: ${lead.source}
Details the lead gave: ${lead.details || "none given"}

Rules:
- Sound like a real person on the design team, not a corporate bot.
- Reference their specific details if given (kitchen size, style, budget, timeline) — if none given, keep it general but still warm.
- The single goal is to get them to reply with a day/time for a quick call.
- Email: subject line + short body (under 120 words), end with a clear question asking for a callback time.
- SMS: under 320 characters, one clear question asking for a callback time. No emojis. No links.
- Premium tone — quality and craftsmanship, not discount language.

Return strict JSON: {"emailSubject": string, "emailBody": string, "smsBody": string}`;

  const res = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  return {
    emailSubject: parsed.emailSubject ?? "Your kitchen design inquiry",
    emailBody: parsed.emailBody ?? "",
    smsBody: parsed.smsBody ?? "",
  };
}

export interface InboundParseResult {
  wantsCall: boolean;
  timeIso: string | null;
  summary: string;
}

export async function parseInboundReply(
  text: string,
  nowIso: string
): Promise<InboundParseResult> {
  const prompt = `Current date/time (Europe/London): ${nowIso}

A lead replied to a kitchen showroom's follow-up message. Determine if they are proposing a specific day/time for a callback.

Their reply: "${text}"

Return strict JSON:
{"wantsCall": boolean, "timeIso": string|null, "summary": string}

- wantsCall: true only if they gave a specific enough day/time to book (e.g. "3pm today", "tomorrow morning", "Friday at 2").
- timeIso: resolve to an absolute ISO 8601 datetime in Europe/London time if wantsCall is true, else null. Assume business hours (9am-6pm) if only a vague time like "morning"/"afternoon" is given (morning=10:00, afternoon=14:00, evening=17:00).
- summary: one short sentence describing what they said, for a staff dashboard.`;

  const res = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  return {
    wantsCall: Boolean(parsed.wantsCall),
    timeIso: parsed.timeIso ?? null,
    summary: parsed.summary ?? text,
  };
}
