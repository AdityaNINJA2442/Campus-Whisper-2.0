import { useState } from "react";
import type { Complaint, Category, AuthUser } from "../types";
import { analyzeComplaint, CATEGORY_META } from "../lib/data";
import { Pill } from "./Shared";

export function NewComplaintForm({
  user, onSubmit, onCancel,
}: { user: AuthUser; onSubmit: (c: Complaint) => void; onCancel: () => void }) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [cat, setCat]           = useState<Category>("maintenance");
  const [preview, setPreview]   = useState<ReturnType<typeof analyzeComplaint> | null>(null);
  const [submitting, setSubmit] = useState(false);

  const handlePreview = () => {
    if (!title.trim() || !desc.trim()) return;
    setPreview(analyzeComplaint(title, desc, cat));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim()) return;
    setSubmit(true);
    await new Promise(r => setTimeout(r, 900));
    const ai = analyzeComplaint(title, desc, cat);
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: `CMP-${String(Math.floor(Math.random() * 900) + 100)}`,
      studentId: user.id,
      studentName: user.name,
      room: user.room ?? "—",
      block: user.block ?? "—",
      category: cat,
      title: title.trim(),
      description: desc.trim(),
      status: (ai.priority === "urgent" || ai.priority === "high") ? "acknowledged" : "open",
      priority: ai.priority,
      aiTags: ai.tags,
      aiNote: ai.note,
      createdAt: now,
      updatedAt: now,
      wardenNote: (ai.priority === "urgent" || ai.priority === "high")
        ? "AI has flagged this as high-priority. Warden has been notified automatically."
        : undefined,
    };
    onSubmit(complaint);
    setSubmit(false);
  };

  return (
    <div style={{ maxWidth: 600, padding: "0 4px" }}>
      <h2 style={{ fontSize: 20, color: "var(--blue-dark)", marginBottom: 4 }}>New Complaint</h2>
      <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 22, fontStyle: "italic" }}>
        AI will automatically assess priority and route to the warden.
      </p>

      {/* Category selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Category</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.entries(CATEGORY_META) as [Category, any][]).map(([k, m]) => (
            <button key={k} onClick={() => { setCat(k); setPreview(null); }}
              style={{
                padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                border: `1.5px solid ${cat === k ? m.color : "var(--border)"}`,
                background: cat === k ? `${m.color}12` : "transparent",
                color: cat === k ? m.color : "var(--text-2)",
                fontWeight: cat === k ? 600 : 400,
                transition: "all .15s",
              }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Title *</label>
        <input className="inp" value={title} placeholder="Short summary of the issue"
          onChange={e => { setTitle(e.target.value); setPreview(null); }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Description *</label>
        <textarea className="inp" value={desc} rows={5}
          placeholder="Describe the problem clearly — location, how long it's been happening, any impact…"
          style={{ resize: "vertical" }}
          onChange={e => { setDesc(e.target.value); setPreview(null); }} />
      </div>

      {/* AI preview panel */}
      {preview && (
        <div style={{
          marginBottom: 18, padding: "12px 16px", borderRadius: 10,
          background: preview.priority === "urgent" ? "rgba(220,38,38,.05)" : "rgba(26,58,110,.04)",
          border: `1px solid ${preview.priority === "urgent" ? "rgba(220,38,38,.2)" : "rgba(201,168,76,.25)"}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", marginBottom: 10, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>
            🤖 AI Preview
          </p>
          <div style={{ display: "flex", gap: 14, fontSize: 13, color: "var(--text-2)", flexWrap: "wrap", alignItems: "center" }}>
            <span>Priority: <Pill kind="priority" value={preview.priority} /></span>
            {preview.priority === "urgent" && (
              <span style={{ color: "#b91c1c", fontWeight: 600 }}>⚠️ Will auto-escalate to warden</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>{preview.note}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ fontSize: 13 }}
          disabled={!title.trim() || !desc.trim()}
          onClick={handlePreview}>
          🔍 Preview AI Analysis
        </button>
        <button className="btn btn-primary" style={{ fontSize: 13 }}
          disabled={submitting || !title.trim() || !desc.trim()}
          onClick={handleSubmit}>
          {submitting ? "Submitting…" : "Submit Complaint →"}
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-2)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: ".05em",
};
