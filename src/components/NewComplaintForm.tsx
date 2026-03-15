import { useState } from "react";
import type { Complaint, Category, AuthUser } from "../types";
import { analyzeComplaint, CATEGORY_META, findDuplicate, buildSLA, generateReceiptId, getComplaintCountToday, incrementComplaintCount, MAX_COMPLAINTS_PER_DAY } from "../lib/data";
import { Pill } from "./Shared";

export function NewComplaintForm({ user, allComplaints, onSubmit, onCancel }: {
  user: AuthUser;
  allComplaints: Complaint[];
  onSubmit: (c: Complaint) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [cat, setCat]             = useState<Category>("maintenance");
  const [isPrivate, setIsPrivate] = useState(false);
  const [preview, setPreview]     = useState<ReturnType<typeof analyzeComplaint> | null>(null);
  const [duplicate, setDuplicate] = useState<Complaint | null>(null);
  const [submitting, setSubmit]   = useState(false);
  const [upvoted, setUpvoted]     = useState(false);

  // Problem 9: rate limit check
  const todayCount = getComplaintCountToday(user.id);
  const rateLimited = todayCount >= MAX_COMPLAINTS_PER_DAY;

  const checkDuplicate = (t: string, c: Category) => {
    if (t.trim().length < 6) { setDuplicate(null); return; }
    setDuplicate(findDuplicate(t, c, allComplaints));
  };

  const handleUpvote = (existing: Complaint) => {
    incrementComplaintCount(user.id);
    const updated: Complaint = {
      ...existing,
      upvotes: existing.upvotes + 1,
      priority: existing.upvotes + 1 >= 5 ? "urgent" : existing.upvotes + 1 >= 3 ? "high" : existing.priority,
      updatedAt: new Date().toISOString(),
    };
    onSubmit(updated);
    setUpvoted(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim() || rateLimited) return;
    setSubmit(true);
    await new Promise(r => setTimeout(r, 800));
    const ai  = analyzeComplaint(title, desc, cat);
    const now = new Date().toISOString();
    // Personal category is always private
    const priv = isPrivate || cat === "personal";
    const c: Complaint = {
      id: `CMP-${String(Math.floor(Math.random() * 900) + 100)}`,
      receiptId: generateReceiptId(),
      studentId: user.id, studentName: user.name,
      room: user.room ?? "—", block: user.block ?? "—",
      category: cat, title: title.trim(), description: desc.trim(),
      status: (ai.priority === "urgent" || ai.priority === "high") ? "acknowledged" : "open",
      priority: ai.priority,
      aiTags: ai.tags, aiNote: ai.note,
      createdAt: now, updatedAt: now,
      sla: buildSLA(ai.priority, now),
      isPrivate: priv,
      upvotes: 1, resolutionRejectedCount: 0,
      wardenNote: (ai.priority === "urgent" || ai.priority === "high") ? "AI flagged as high-priority. Warden notified." : undefined,
    };
    incrementComplaintCount(user.id);
    onSubmit(c);
    setSubmit(false);
  };

  // Success: upvoted
  if (upvoted) return (
    <div style={{ maxWidth: 560, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
      <h2 style={{ fontSize: 20, color: "var(--blue-dark)", marginBottom: 8 }}>Your voice added!</h2>
      <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>This complaint now has more weight. High-upvote complaints are automatically escalated.</p>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onCancel}>Back to my complaints</button>
    </div>
  );

  // Problem 9: rate limit wall
  if (rateLimited) return (
    <div style={{ maxWidth: 520, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚦</div>
      <h2 style={{ fontSize: 20, color: "var(--blue-dark)", marginBottom: 8 }}>Daily limit reached</h2>
      <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
        You have submitted <strong>{todayCount}</strong> complaints today. The maximum is <strong>{MAX_COMPLAINTS_PER_DAY}</strong> per day.
        This helps keep the system fair for everyone. Your limit resets at midnight.
      </p>
      <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>If this is an emergency, contact the warden directly.</p>
      <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={onCancel}>Go back</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 20, color: "var(--blue-dark)", marginBottom: 4 }}>New Complaint</h2>
      <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6, fontStyle: "italic" }}>AI will assess priority and route to the warden automatically.</p>

      {/* Problem 9: daily count indicator */}
      <div style={{ marginBottom: 20, padding: "8px 14px", borderRadius: 8, background: "var(--cream-dark)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>Today's complaints:</span>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: MAX_COMPLAINTS_PER_DAY }).map((_, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: i < todayCount ? "var(--blue)" : "var(--slate-dark)", border: "1px solid var(--border)" }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{MAX_COMPLAINTS_PER_DAY - todayCount} remaining</span>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Category</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.entries(CATEGORY_META) as [Category, any][]).map(([k, m]) => (
            <button key={k} onClick={() => { setCat(k); setPreview(null); checkDuplicate(title, k); if (k === "personal") setIsPrivate(true); }}
              style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: `1.5px solid ${cat === k ? m.color : "var(--border)"}`, background: cat === k ? `${m.color}12` : "transparent", color: cat === k ? m.color : "var(--text-2)", fontWeight: cat === k ? 600 : 400, transition: "all .15s" }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Title *</label>
        <input className="inp" value={title} placeholder="Short summary of the issue"
          onChange={e => { setTitle(e.target.value); setPreview(null); checkDuplicate(e.target.value, cat); }} />
      </div>

      {/* Duplicate warning */}
      {duplicate && (
        <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(109,40,217,.05)", border: "2px solid rgba(109,40,217,.25)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#6b21a8", marginBottom: 6 }}>👥 Similar complaint already exists!</p>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}><strong>"{duplicate.title}"</strong></p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
            {duplicate.upvotes} student{duplicate.upvotes > 1 ? "s" : ""} already reported this · Status: <strong>{duplicate.status}</strong>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => handleUpvote(duplicate)}>👍 Add my upvote</button>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setDuplicate(null)}>File separately</button>
          </div>
        </div>
      )}

      {!duplicate && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Description *</label>
            <textarea className="inp" value={desc} rows={5} placeholder="Describe clearly — location, how long, impact…" style={{ resize: "vertical" }}
              onChange={e => { setDesc(e.target.value); setPreview(null); }} />
          </div>

          {/* Problem 11: Private toggle */}
          <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: isPrivate ? "rgba(146,64,14,.06)" : "var(--cream-dark)", border: `1px solid ${isPrivate ? "rgba(146,64,14,.25)" : "var(--border)"}`, cursor: "pointer" }}
            onClick={() => setIsPrivate(!isPrivate)}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: isPrivate ? "#92400e" : "var(--slate-dark)", position: "relative", transition: "background .2s", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isPrivate ? 18 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: isPrivate ? "#92400e" : "var(--text-2)" }}>🔒 {isPrivate ? "Private complaint" : "Mark as private"}</p>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Private complaints show only the category and status to other students. Full details visible to warden only.</p>
            </div>
          </div>

          {/* AI Preview */}
          {preview && (
            <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(26,58,110,.04)", border: "1px solid rgba(201,168,76,.25)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", marginBottom: 10, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>🤖 AI Preview</p>
              <div style={{ display: "flex", gap: 14, fontSize: 13, flexWrap: "wrap", alignItems: "center" }}>
                <span>Priority: <Pill kind="priority" value={preview.priority} /></span>
                <span style={{ color: "var(--text-3)" }}>SLA: <strong>{preview.priority === "urgent" ? "4h" : preview.priority === "high" ? "24h" : preview.priority === "medium" ? "72h" : "7 days"}</strong></span>
                {(preview.priority === "urgent" || preview.priority === "high") && <span style={{ color: "#b91c1c", fontWeight: 600 }}>⚠️ Will auto-escalate</span>}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>{preview.note}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} disabled={!title.trim() || !desc.trim()} onClick={() => setPreview(analyzeComplaint(title, desc, cat))}>🔍 Preview AI</button>
            <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={submitting || !title.trim() || !desc.trim()} onClick={handleSubmit}>{submitting ? "Submitting…" : "Submit →"}</button>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" };
