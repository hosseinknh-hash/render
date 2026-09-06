import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      callTasks: { orderBy: { scheduledAt: "asc" } },
    },
  });
  if (!lead) notFound();

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "sans-serif",
        color: "#111111",
      }}
    >
      <h1 style={{ fontSize: 22 }}>{lead.name}</h1>
      <p style={{ color: "#666" }}>
        {lead.email} {lead.phone && `· ${lead.phone}`} · {lead.source} · status: {lead.status}
      </p>
      {lead.details && (
        <p style={{ marginTop: 12 }}>
          <strong>Details:</strong> {lead.details}
        </p>
      )}

      {lead.callTasks.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: "#f3fbf6", borderRadius: 8 }}>
          <strong>Booked calls</strong>
          {lead.callTasks.map((task) => (
            <div key={task.id}>
              {new Date(task.scheduledAt).toLocaleString("en-GB")} — {task.status}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Message thread</h2>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {lead.messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: 10,
              borderRadius: 8,
              background: m.direction === "outbound" ? "#f5f5f5" : "#eaf3ff",
              maxWidth: "80%",
              marginLeft: m.direction === "outbound" ? 0 : "auto",
            }}
          >
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              {m.channel} · {m.direction} · {new Date(m.createdAt).toLocaleString("en-GB")}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{m.body}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
