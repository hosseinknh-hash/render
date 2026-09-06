import { NextRequest, NextResponse } from "next/server";
import { createLeadAndOutreach } from "@/lib/leadPipeline";

// Public endpoint — your website form / Zapier / Meta Lead Ads bridge posts here.
// Protected by a shared secret (LEADS_INTAKE_KEY) instead of a login, since it has no user session.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!process.env.LEADS_INTAKE_KEY || apiKey !== process.env.LEADS_INTAKE_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.name || (!body.email && !body.phone)) {
    return NextResponse.json(
      { error: "name and at least one of email/phone are required" },
      { status: 400 }
    );
  }

  try {
    const lead = await createLeadAndOutreach({
      name: body.name,
      email: body.email,
      phone: body.phone,
      details: body.details,
      source: body.source || "website",
    });
    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[leads/intake]", err);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}
