"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputStyle: CSSProperties = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
};

export default function AddLeadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          details: details || undefined,
          source: "manual",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add lead");
      }
      setName("");
      setEmail("");
      setPhone("");
      setDetails("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 8, padding: 16, border: "1px solid #eee", borderRadius: 8 }}
    >
      <strong>Log a phone inquiry</strong>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={inputStyle}
      />
      <input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Phone (optional, e.g. +447700900000)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Details they gave (kitchen size, budget, style, timeline)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        style={inputStyle}
      />
      {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#111111",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Sending outreach…" : "Add lead & send outreach"}
      </button>
    </form>
  );
}
