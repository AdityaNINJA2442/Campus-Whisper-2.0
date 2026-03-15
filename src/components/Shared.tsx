import { useState } from "react";
import type { Complaint, Status, Priority, Category } from "../types";
import { CATEGORY_META, PRIORITY_META, STATUS_META, timeAgo, slaLabel, printReceipt } from "../lib/data";

// ── Pill ──────────────────────────────────────────────────────────────────────
export function Pill({ kind, value }: { kind: "status"|"priority"|"category"; value: string }) {
  const meta   = kind === "status" ? STATUS_META[value] : kind === "priority" ? PRIORITY_META[value] : CATEGORY_META[value];
  const color  = (meta as any).color;
  const bg     = (meta as any).bg    ?? `${color}14`;
  const border = (meta as any).border ?? `${color}44`;
  return (
    <span className="pill" style={{ color, background: bg, borderColor: border }}>
      {(meta as any).icon && <span style={{ fontSize: 10 }}>{(meta as any).icon}</span>}
      {(meta as any).label}
    </span>
  );
}

// ── NavBar ────────────────────────────────────────────────────────────────────
export function NavBar({ name, role, onLogout, onNew }: { name: string; role: string; onLogout: () => void; onNew?: () => void }) {
  return (
    <header style={{ height: 58, background: "linear-gradient(135deg, var(--blue-deep), var(--blue-dark) 60%, var(--blue))", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 14px rgba(0,0,0,.3)" }}>
      <span style={{ fontSize: 18, color: "var(--gold)" }}>🏛️</span>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Tiro Devanagari Hindi', serif" }}>Campus Whisper</div>
        <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono'", letterSpacing: ".1em", textTransform: "uppercase" }}>
          {role === "warden" ? "Warden Console" : "Student Portal"}
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {onNew && <button className="btn btn-gold" style={{ padding: "7px 16px", fontSize: 13 }} onClick={onNew}>+ New Complaint</button>}
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--blue-dark)" }}>
          {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", textTransform: "capitalize" }}>{role}</div>
        </div>
        <button onClick={onLogout} style={{ padding: "5px 11px", borderRadius: 6, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.65)", fontSize: 12, cursor: "pointer" }}>Out</button>
      </div>
    </header>
  );
}

// ── Complaint card ────────────────────────────────────────────────────────────
export function ComplaintCard({ c, selected, onClick, isWarden }: { c: Complaint; selected?: boolean; onClick: () => void; isWarden?: boolean }) {
  const pm  = PRIORITY_META[c.priority];
  const sla = slaLabel(c.sla, c.status);

  // Problem 11: hide private details from non-warden
  const showTitle = !c.isPrivate || isWarden;

  return (
    <div onClick={onClick} style={{ padding: "13px 15px", borderRadius: 12, marginBottom: 8, background: selected ? "rgba(26,58,110,.05)" : "var(--surface)", border: `1.5px solid ${selected ? "var(--blue-mid)" : "var(--border)"}`, borderLeft: `4px solid ${pm.color}`, cursor: "pointer", transition: "border-color .15s, box-shadow .15s", boxShadow: selected ? "0 4px 14px rgba(26,58,110,.12)" : "var(--sh-sm)" }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = "var(--blue-light)"; e.currentTarget.style.boxShadow = "var(--sh-md)"; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--sh-sm)"; } }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          {c.isPrivate && <span style={{ fontSize: 10, color: "#92400e", fontFamily: "'JetBrains Mono'", marginBottom: 3, display: "block" }}>🔒 Private</span>}
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3 }}>
            {showTitle ? c.title : "🔒 Private complaint — warden only"}
          </p>
        </div>
        <Pill kind="status" value={c.status} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <Pill kind="category" value={c.category} />
        <Pill kind="priority" value={c.priority} />
        {c.upvotes > 1 && (
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(109,40,217,.08)", color: "#6b21a8", border: "1px solid rgba(109,40,217,.2)", fontFamily: "'JetBrains Mono'" }}>👥 {c.upvotes}</span>
        )}
        <span style={{ fontSize: 11, color: sla.color, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>⏱ {sla.text}</span>
      </div>
      {c.status === "pending_confirmation" && !isWarden && (
        <div style={{ marginTop: 7, padding: "4px 10px", borderRadius: 6, background: "rgba(3,105,161,.07)", border: "1px solid rgba(3,105,161,.2)", fontSize: 11, color: "#0369a1", fontFamily: "'JetBrains Mono'" }}>✋ Confirm resolution</div>
      )}
      {c.status === "reopened" && (
        <div style={{ marginTop: 7, padding: "4px 10px", borderRadius: 6, background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", fontSize: 11, color: "#b91c1c", fontFamily: "'JetBrains Mono'" }}>🔁 Reopened</div>
      )}
      <div style={{ marginTop: 5, display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>{c.id} · {timeAgo(c.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Complaint Detail ──────────────────────────────────────────────────────────
export function ComplaintDetail({ c, isWarden, onUpdate }: { c: Complaint; isWarden: boolean; onUpdate: (u: Complaint) => void }) {
  const [wardenNote, setWardenNote]   = useState("");
  const [resNote, setResNote]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [showResForm, setShowResForm] = useState(false);
  const sla = slaLabel(c.sla, c.status);
  const pm  = PRIORITY_META[c.priority];

  const saveNote = async () => {
    if (!wardenNote.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onUpdate({ ...c, wardenNote: wardenNote.trim(), status: c.status === "open" ? "acknowledged" : c.status, updatedAt: new Date().toISOString() });
    setWardenNote(""); setSaving(false);
  };

  const markResolved = async () => {
    if (!resNote.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onUpdate({ ...c, status: "pending_confirmation", resolutionNote: resNote.trim(), updatedAt: new Date().toISOString() });
    setResNote(""); setShowResForm(false); setSaving(false);
  };

  const setStatus = (status: Status) => {
    if (status === "resolved") { setShowResForm(true); return; }
    onUpdate({ ...c, status, updatedAt: new Date().toISOString() });
  };

  const confirmResolved = () => onUpdate({ ...c, status: "resolved", studentConfirmed: true, resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const rejectResolved  = () => onUpdate({ ...c, status: "reopened", studentRejectedAt: new Date().toISOString(), resolutionRejectedCount: (c.resolutionRejectedCount || 0) + 1, updatedAt: new Date().toISOString() });

  // Problem 11: if private and viewer is student (not owner), block view
  const isOwner = !isWarden;

  return (
    <div className="ai" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", background: "var(--cream-dark)", padding: "2px 8px", borderRadius: 4 }}>{c.id}</span>
          <Pill kind="status" value={c.status} />
          <Pill kind="priority" value={c.priority} />
          <Pill kind="category" value={c.category} />
          {c.isPrivate && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(146,64,14,.1)", color: "#92400e", border: "1px solid rgba(146,64,14,.2)", fontFamily: "'JetBrains Mono'" }}>🔒 Private</span>}
          {c.upvotes > 1 && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "rgba(109,40,217,.08)", color: "#6b21a8", border: "1px solid rgba(109,40,217,.2)", fontFamily: "'JetBrains Mono'" }}>👥 {c.upvotes} students reported this</span>}
          <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: `${sla.color}14`, color: sla.color, border: `1px solid ${sla.color}44`, fontFamily: "'JetBrains Mono'" }}>⏱ {sla.text}</span>
          {/* Problem 5: receipt button */}
          <button onClick={() => printReceipt(c)} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "rgba(26,58,110,.07)", border: "1px solid rgba(26,58,110,.2)", color: "var(--blue)", fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono'" }}>
            🧾 Receipt
          </button>
        </div>
        <h2 style={{ fontSize: 18, color: "var(--blue-dark)", marginBottom: 4 }}>{c.title}</h2>
        <p style={{ fontSize: 12, color: "var(--text-3)" }}>
          {isWarden ? <>Room <strong>{c.room}</strong>, Block <strong>{c.block}</strong> · {c.studentName} · </> : ""}
          Submitted {timeAgo(c.createdAt)}
          {c.resolvedAt && <> · Resolved {timeAgo(c.resolvedAt)}</>}
          <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--text-3)" }}>Receipt: {c.receiptId}</span>
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Description */}
        <div className="card" style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Description</p>
          <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{c.description}</p>
        </div>

        {/* AI Analysis */}
        <div style={{ padding: "12px 16px", borderRadius: 10, background: c.priority === "urgent" ? "rgba(220,38,38,.04)" : "rgba(26,58,110,.04)", border: `1px solid ${c.priority === "urgent" ? "rgba(220,38,38,.2)" : "rgba(201,168,76,.25)"}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: c.priority === "urgent" ? "#b91c1c" : "var(--gold-dark)", marginBottom: 8, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>🤖 AI Analysis</p>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: c.aiTags.length ? 8 : 0 }}>{c.aiNote}</p>
          {c.aiTags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.aiTags.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${pm.color}14`, color: pm.color, border: `1px solid ${pm.color}33`, fontFamily: "'JetBrains Mono'" }}>{t}</span>)}
            </div>
          )}
        </div>

        {/* SLA Bar */}
        {c.status !== "resolved" && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: "var(--text-2)" }}>⏱ SLA Deadline</span>
              <span style={{ color: sla.color, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{sla.text}</span>
            </div>
            {c.sla && (() => {
              const pct = Math.min(100, Math.round(((c.sla.deadlineHours - c.sla.hoursLeft) / c.sla.deadlineHours) * 100));
              return (
                <>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--cream-dark)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: c.sla.breached ? "#b91c1c" : pct > 75 ? "#c2410c" : pct > 50 ? "#92400e" : "#166534", transition: "width .6s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginTop: 5, fontFamily: "'JetBrains Mono'" }}>
                    <span>Filed {timeAgo(c.createdAt)}</span>
                    <span>Deadline: {new Date(c.sla.deadlineAt).toLocaleString()}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Warden note */}
        {c.wardenNote && (
          <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid var(--gold)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>📝 Warden's Note</p>
            <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{c.wardenNote}</p>
          </div>
        )}

        {/* Resolution note */}
        {c.resolutionNote && (
          <div className="card" style={{ padding: "14px 18px", borderLeft: "4px solid #166534" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>✅ Resolution Details</p>
            <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{c.resolutionNote}</p>
            {c.resolvedAt && <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>Resolved: {new Date(c.resolvedAt).toLocaleString()}</p>}
          </div>
        )}

        {/* Student confirmation panel */}
        {!isWarden && c.status === "pending_confirmation" && (
          <div style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(3,105,161,.05)", border: "2px solid rgba(3,105,161,.3)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>✋ Has your issue been resolved?</p>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14, lineHeight: 1.6 }}>The warden marked this resolved. Please confirm if it's actually fixed — if not, it will re-escalate automatically.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={confirmResolved} style={{ background: "#166534", color: "#fff", fontSize: 13, padding: "8px 18px" }}>✅ Yes, fixed</button>
              <button className="btn btn-ghost" onClick={rejectResolved} style={{ fontSize: 13, color: "#b91c1c", borderColor: "rgba(220,38,38,.3)", padding: "8px 18px" }}>❌ Not fixed</button>
            </div>
          </div>
        )}

        {/* Rejection history */}
        {c.resolutionRejectedCount > 0 && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.2)", fontSize: 12, color: "#b91c1c" }}>
            🔁 Rejected <strong>{c.resolutionRejectedCount}</strong> time{c.resolutionRejectedCount > 1 ? "s" : ""}
            {c.studentRejectedAt && <> · Last: {timeAgo(c.studentRejectedAt)}</>}
          </div>
        )}

        {/* Warden actions */}
        {isWarden && c.status !== "resolved" && (
          <div className="card" style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Warden Actions</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {(["acknowledged","in_progress","resolved"] as Status[]).map(s => {
                const sm  = STATUS_META[s];
                const cur = c.status === s || (s === "resolved" && c.status === "pending_confirmation");
                return (
                  <button key={s} onClick={() => setStatus(s)} disabled={cur} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: cur ? "default" : "pointer", border: `1.5px solid ${sm.border}`, background: cur ? sm.bg : "transparent", color: sm.color, fontFamily: "'JetBrains Mono'", opacity: cur ? 1 : 0.75, transition: "opacity .15s" }}
                    onMouseEnter={e => { if (!cur) e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { if (!cur) e.currentTarget.style.opacity = "0.75"; }}
                  >{s === "resolved" ? "Mark Resolved" : sm.label}</button>
                );
              })}
            </div>

            {showResForm && (
              <div style={{ padding: "14px", borderRadius: 8, background: "rgba(22,163,74,.05)", border: "1px solid rgba(22,163,74,.2)", marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>📋 What action was taken? (required)</p>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>Be specific — who visited, what was fixed, when. Student will see this.</p>
                <textarea className="inp" value={resNote} onChange={e => setResNote(e.target.value)} placeholder="e.g. Plumber visited Room 204 on March 14. Pipe joint replaced, ceiling sealed." rows={4} style={{ resize: "vertical", marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" disabled={!resNote.trim() || saving} onClick={markResolved} style={{ fontSize: 13 }}>{saving ? "Saving…" : "Confirm Resolution →"}</button>
                  <button className="btn btn-ghost" onClick={() => setShowResForm(false)} style={{ fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            )}

            {!showResForm && (
              <>
                <textarea className="inp" value={wardenNote} onChange={e => setWardenNote(e.target.value)} placeholder="Add a note for the student…" rows={3} style={{ resize: "vertical", marginBottom: 10 }} />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" disabled={saving || !wardenNote.trim()} onClick={saveNote} style={{ fontSize: 13, padding: "8px 18px" }}>{saving ? "Saving…" : "Save Note →"}</button>
                </div>
              </>
            )}
          </div>
        )}

        {c.status === "resolved" && c.studentConfirmed && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.25)", fontSize: 13, color: "#166534", fontWeight: 600 }}>
            ✅ Student confirmed resolved on {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : "—"}
          </div>
        )}
      </div>
    </div>
  );
}
