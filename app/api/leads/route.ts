import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadAndOutreach } from "@/lib/leadPipeline";

// Protected by middleware.ts (basic auth) — staff-only.
export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, callTasks: true },
  });
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
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
      source: body.source || "manual",
    });
    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[leads]", err);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}
