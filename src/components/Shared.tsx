import type { Complaint, Category, Priority, Status } from "../types";
import { CATEGORY_META, PRIORITY_META, STATUS_META, timeAgo } from "../lib/data";

// ── Pill badge ───────────────────────────────────────────────────────────────
export function Pill({ kind, value }: { kind: "status" | "priority" | "category"; value: string }) {
  const meta =
    kind === "status"   ? STATUS_META[value as Status] :
    kind === "priority" ? PRIORITY_META[value as Priority] :
    CATEGORY_META[value as Category];

  const color  = (meta as any).color;
  const bg     = (meta as any).bg     ?? `${color}14`;
  const border = (meta as any).border ?? `${color}44`;
  const label  = (meta as any).label;
  const icon   = (meta as any).icon ?? "";

  return (
    <span className="pill" style={{ color, background: bg, borderColor: border }}>
      {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
      {label}
    </span>
  );
}

// ── Complaint card ───────────────────────────────────────────────────────────
export function ComplaintCard({
  c, selected, onClick,
}: { c: Complaint; selected?: boolean; onClick: () => void }) {
  const pm = PRIORITY_META[c.priority];
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: selected ? "rgba(26,58,110,.05)" : "var(--surface)",
        border: `1.5px solid ${selected ? "var(--blue-mid)" : "var(--border)"}`,
        cursor: "pointer",
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: selected ? "0 4px 14px rgba(26,58,110,.12)" : "var(--sh-sm)",
        marginBottom: 8,
        borderLeft: `4px solid ${pm.color}`,
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = "var(--blue-light)"; e.currentTarget.style.boxShadow = "var(--sh-md)"; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--sh-sm)"; } }}
    >
      {/* Row 1 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3, flex: 1 }}>{c.title}</p>
        <Pill kind="status" value={c.status} />
      </div>

      {/* Row 2 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <Pill kind="category" value={c.category} />
        <Pill kind="priority" value={c.priority} />
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>
          {c.id} · {timeAgo(c.createdAt)}
        </span>
      </div>

      {/* AI escalation banner */}
      {(c.priority === "urgent" || c.priority === "high") && c.status === "open" && (
        <div style={{ marginTop: 8, padding: "4px 10px", borderRadius: 6, background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.18)", fontSize: 11, color: "#b91c1c", fontFamily: "'JetBrains Mono'" }}>
          🤖 AI auto-escalated
        </div>
      )}
    </div>
  );
}

// ── Top nav bar ──────────────────────────────────────────────────────────────
export function NavBar({
  name, role, onLogout, onNew,
}: { name: string; role: string; onLogout: () => void; onNew?: () => void }) {
  return (
    <header style={{
      height: 58,
      background: `linear-gradient(135deg, var(--blue-deep), var(--blue-dark) 60%, var(--blue))`,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 2px 14px rgba(0,0,0,.3)",
    }}>
      <span style={{ fontSize: 18, color: "var(--gold)" }}>🏛️</span>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Tiro Devanagari Hindi', serif" }}>
          Hostel Grievance Portal
        </div>
        <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono'", letterSpacing: ".1em", textTransform: "uppercase" }}>
          {role === "warden" ? "Warden Console" : "Student Portal"}
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {onNew && (
          <button className="btn btn-gold" style={{ padding: "7px 16px", fontSize: 13 }} onClick={onNew}>
            + New Complaint
          </button>
        )}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "var(--blue-dark)",
        }}>{name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
        <div>
          <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", textTransform: "capitalize" }}>{role}</div>
        </div>
        <button onClick={onLogout} style={{ padding: "5px 11px", borderRadius: 6, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.65)", fontSize: 12, cursor: "pointer" }}>
          Out
        </button>
      </div>
    </header>
  );
}

// ── Detail panel: complaint view + warden controls ───────────────────────────
export function ComplaintDetail({
  c, isWarden, onUpdate,
}: { c: Complaint; isWarden: boolean; onUpdate: (updated: Complaint) => void }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onUpdate({ ...c, wardenNote: note.trim(), status: c.status === "open" ? "acknowledged" : c.status, updatedAt: new Date().toISOString() });
    setNote("");
    setSaving(false);
  };

  const setStatus = (status: string) => {
    onUpdate({
      ...c, status: status as Status,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === "resolved" ? new Date().toISOString() : c.resolvedAt,
    });
  };

  const pm = PRIORITY_META[c.priority];

  return (
    <div className="ai" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", background: "var(--cream-dark)", padding: "2px 8px", borderRadius: 4 }}>{c.id}</span>
          <Pill kind="status"   value={c.status} />
          <Pill kind="priority" value={c.priority} />
          <Pill kind="category" value={c.category} />
        </div>
        <h2 style={{ fontSize: 18, color: "var(--blue-dark)", marginBottom: 4 }}>{c.title}</h2>
        <p style={{ fontSize: 12, color: "var(--text-3)" }}>
          {isWarden ? <>Room <strong>{c.room}</strong>, Block <strong>{c.block}</strong> · {c.studentName} · </> : ""}
          Submitted {timeAgo(c.createdAt)}
          {c.resolvedAt && <> · Resolved {timeAgo(c.resolvedAt)}</>}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Description */}
        <div className="card" style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Description</p>
          <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{c.description}</p>
        </div>

        {/* AI Analysis */}
        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: c.priority === "urgent" ? "rgba(220,38,38,.04)" : "rgba(26,58,110,.04)",
          border: `1px solid ${c.priority === "urgent" ? "rgba(220,38,38,.2)" : "rgba(201,168,76,.25)"}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: c.priority === "urgent" ? "#b91c1c" : "var(--gold-dark)", marginBottom: 8, fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: ".05em" }}>
            🤖 AI Analysis
          </p>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: c.aiTags.length > 0 ? 8 : 0 }}>{c.aiNote}</p>
          {c.aiTags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.aiTags.map(t => (
                <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${pm.color}14`, color: pm.color, border: `1px solid ${pm.color}33`, fontFamily: "'JetBrains Mono'" }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Warden note */}
        {c.wardenNote && (
          <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid var(--gold)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
              📝 Warden's Note
            </p>
            <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{c.wardenNote}</p>
          </div>
        )}

        {/* Warden controls */}
        {isWarden && c.status !== "resolved" && (
          <div className="card" style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
              Warden Actions
            </p>

            {/* Status change */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {(["acknowledged", "in_progress", "resolved"] as Status[]).map(s => {
                const sm = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    disabled={c.status === s}
                    style={{
                      padding: "6px 14px", borderRadius: 20,
                      fontSize: 12, fontWeight: 600, cursor: c.status === s ? "default" : "pointer",
                      border: `1.5px solid ${sm.border}`,
                      background: c.status === s ? sm.bg : "transparent",
                      color: sm.color,
                      fontFamily: "'JetBrains Mono'",
                      opacity: c.status === s ? 1 : 0.7,
                      transition: "opacity .15s",
                    }}
                    onMouseEnter={e => { if (c.status !== s) e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { if (c.status !== s) e.currentTarget.style.opacity = "0.7"; }}
                  >
                    {sm.label}
                  </button>
                );
              })}
            </div>

            {/* Note input */}
            <textarea className="inp" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note for the student (action taken, ETA, etc.)…"
              rows={3} style={{ resize: "vertical", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" disabled={saving || !note.trim()} onClick={saveNote} style={{ fontSize: 13, padding: "8px 18px" }}>
                {saving ? "Saving…" : "Save Note →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// need useState for ComplaintDetail
import { useState } from "react";
import type { Status } from "../types";
