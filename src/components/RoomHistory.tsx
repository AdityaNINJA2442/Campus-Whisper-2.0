import type { Complaint } from "../types";
import { CATEGORY_META, PRIORITY_META, STATUS_META, timeAgo } from "../lib/data";

export function RoomHistory({ room, block, complaints }: { room: string; block: string; complaints: Complaint[] }) {
  const roomComplaints = complaints
    .filter(c => c.room === room && c.block === block)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (roomComplaints.length === 0) return (
    <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🏠</div>
      <p style={{ fontStyle: "italic" }}>No complaint history for Room {room}, Block {block}</p>
    </div>
  );

  // Pattern detection — same category 2+ times
  const catCounts: Record<string, number> = {};
  roomComplaints.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });
  const repeatingIssues = Object.entries(catCounts).filter(([, v]) => v >= 2).map(([k]) => k);

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, color: "var(--blue-dark)" }}>Room {room}, Block {block} — History</h3>
        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: "var(--text-3)", background: "var(--cream-dark)", padding: "2px 8px", borderRadius: 10 }}>{roomComplaints.length} total</span>
      </div>

      {/* Pattern alert */}
      {repeatingIssues.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.2)", marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>⚠️ Repeat issue detected</p>
          <p style={{ fontSize: 12, color: "var(--text-2)" }}>
            This room has recurring <strong>{repeatingIssues.map(k => CATEGORY_META[k]?.label).join(", ")}</strong> complaints.
            This may indicate a structural problem that needs permanent fixing.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, width: 2, background: "var(--border)" }} />
        {roomComplaints.map((c, i) => {
          const pm = PRIORITY_META[c.priority];
          const sm = STATUS_META[c.status];
          return (
            <div key={c.id} style={{ position: "relative", paddingLeft: 44, marginBottom: 16 }}>
              <div style={{ position: "absolute", left: 10, top: 12, width: 14, height: 14, borderRadius: "50%", background: pm.color, border: "2px solid var(--surface)", boxShadow: `0 0 0 2px ${pm.color}33` }} />
              <div className="card" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", flex: 1, lineHeight: 1.3 }}>{c.isPrivate ? "🔒 Private complaint" : c.title}</p>
                  <span style={{ fontSize: 10, color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`, padding: "1px 7px", borderRadius: 10, fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>{sm.label}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
                  <span>{CATEGORY_META[c.category]?.icon} {CATEGORY_META[c.category]?.label}</span>
                  <span>·</span>
                  <span style={{ color: pm.color }}>{pm.label}</span>
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                  <span>·</span>
                  <span style={{ fontFamily: "'JetBrains Mono'" }}>{c.id}</span>
                </div>
                {c.resolutionNote && (
                  <p style={{ fontSize: 12, color: "#166534", marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                    ✅ {c.resolutionNote.slice(0, 100)}{c.resolutionNote.length > 100 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
