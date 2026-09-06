import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddLeadForm from "@/components/AddLeadForm";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { callTasks: { orderBy: { scheduledAt: "asc" } } },
  });

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "sans-serif",
        color: "#111111",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Leads</h1>
      <AddLeadForm />
      <div style={{ marginTop: 32 }}>
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            style={{
              display: "block",
              padding: 16,
              marginBottom: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{lead.name}</strong>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#888" }}>
                {lead.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {lead.email || lead.phone} · {lead.source}
            </div>
            {lead.callTasks.length > 0 && (
              <div style={{ fontSize: 13, color: "#0a7", marginTop: 4 }}>
                Call booked: {new Date(lead.callTasks[0].scheduledAt).toLocaleString("en-GB")}
              </div>
            )}
          </Link>
        ))}
        {leads.length === 0 && <p style={{ color: "#888" }}>No leads yet.</p>}
      </div>
    </main>
  );
}
