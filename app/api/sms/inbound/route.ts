import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseInboundReply } from "@/lib/ai";
import { sendSms, validateTwilioSignature } from "@/lib/sms";
import { createOutlookEvent } from "@/lib/calendar";

const EMPTY_TWIML = new NextResponse("<Response></Response>", {
  headers: { "Content-Type": "text/xml" },
});

// Public webhook — Twilio posts here on every inbound SMS reply.
// Configure this URL as the "A message comes in" webhook on your Twilio number.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const signature = req.headers.get("x-twilio-signature");
  if (!validateTwilioSignature(req.nextUrl.toString(), params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params.From;
  const body = params.Body || "";

  const lead = await prisma.lead.findFirst({
    where: { phone: from },
    orderBy: { createdAt: "desc" },
  });

  if (!lead) return EMPTY_TWIML;

  await prisma.message.create({
    data: { leadId: lead.id, channel: "sms", direction: "inbound", body },
  });

  const parsed = await parseInboundReply(body, new Date().toISOString());

  if (parsed.wantsCall && parsed.timeIso) {
    const eventId = await createOutlookEvent({
      subject: `Callback: ${lead.name}`,
      bodyText: `${lead.name} (${lead.phone || lead.email}) asked for a callback.\n\nContext: ${
        lead.details || "n/a"
      }\n\nTheir message: "${body}"`,
      startIso: parsed.timeIso,
    });

    await prisma.callTask.create({
      data: {
        leadId: lead.id,
        scheduledAt: new Date(parsed.timeIso),
        assigneeEmail: process.env.DESIGNER_EMAIL || "",
        outlookEventId: eventId,
        notes: parsed.summary,
      },
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { status: "booked" } });

    const confirmMsg = `Perfect, you're booked in for ${new Date(parsed.timeIso).toLocaleString(
      "en-GB",
      { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }
    )}. Speak soon!`;
    await sendSms(lead.phone!, confirmMsg);
    await prisma.message.create({
      data: { leadId: lead.id, channel: "sms", direction: "outbound", body: confirmMsg },
    });
  } else if (!lead.clarifySent) {
    const clarifyMsg = `Thanks! What day/time works best for a quick call — today or tomorrow?`;
    await sendSms(lead.phone!, clarifyMsg);
    await prisma.message.create({
      data: { leadId: lead.id, channel: "sms", direction: "outbound", body: clarifyMsg },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "replied", clarifySent: true },
    });
  } else {
    await prisma.lead.update({ where: { id: lead.id }, data: { status: "replied" } });
  }

  return EMPTY_TWIML;
}
