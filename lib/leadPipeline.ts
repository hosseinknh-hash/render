import { prisma } from "./prisma";
import { draftOutreach } from "./ai";
import { sendEmail } from "./email";
import { sendSms } from "./sms";

export interface NewLeadInput {
  name: string;
  email?: string;
  phone?: string;
  details?: string;
  source: string;
}

export async function createLeadAndOutreach(input: NewLeadInput) {
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      details: input.details,
      source: input.source,
    },
  });

  const draft = await draftOutreach({ name: lead.name, details: lead.details, source: lead.source });

  if (lead.email) {
    await sendEmail(lead.email, draft.emailSubject, draft.emailBody);
    await prisma.message.create({
      data: {
        leadId: lead.id,
        channel: "email",
        direction: "outbound",
        body: `${draft.emailSubject}\n\n${draft.emailBody}`,
      },
    });
  }

  if (lead.phone) {
    await sendSms(lead.phone, draft.smsBody);
    await prisma.message.create({
      data: { leadId: lead.id, channel: "sms", direction: "outbound", body: draft.smsBody },
    });
  }

  await prisma.lead.update({ where: { id: lead.id }, data: { status: "contacted" } });

  return lead;
}
