import { useState, useMemo } from "react";
import type { AuthUser, Complaint, Category, Priority, Status, Student } from "../types";
import { CATEGORY_META, PRIORITY_META, STATUS_META, slaLabel, computeAnalytics, getBreachedComplaints, STUDENT_STORE } from "../lib/data";
import { NavBar, ComplaintCard, ComplaintDetail, Pill } from "../components/Shared";
import { StudentManager } from "../components/StudentManager";
import { RoomHistory } from "../components/RoomHistory";

type SortBy    = "sla" | "priority" | "newest" | "upvotes";
type WardenTab = "complaints" | "analytics" | "students" | "room_history";

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER:   Record<Status,   number> = { reopened: 0, open: 1, acknowledged: 2, in_progress: 3, pending_confirmation: 4, resolved: 5 };

interface Props {
  user: AuthUser;
  onLogout: () => void;
  complaints: Complaint[];
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
}

export function WardenPortal({ user, onLogout, complaints, setComplaints }: Props) {
  const [selected, setSelected]     = useState<Complaint | null>(null);
  const [tab, setTab]               = useState<WardenTab>("complaints");
  const [catFilter, setCat]         = useState<Category | "all">("all");
  const [priFilter, setPri]         = useState<Priority | "all">("all");
  const [staFilter, setSta]         = useState<Status   | "all">("all");
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<SortBy>("sla");
  const [students, setStudents]     = useState<Student[]>(STUDENT_STORE);
  const [historyRoom, setHistoryRoom] = useState<{ room: string; block: string } | null>(null);

  const handleUpdate = (updated: Complaint) => {
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  };

  const stats = {
    total:          complaints.length,
    urgent:         complaints.filter(c => c.priority === "urgent" && c.status !== "resolved").length,
    open:           complaints.filter(c => c.status === "open").length,
    active:         complaints.filter(c => c.status === "in_progress" || c.status === "acknowledged").length,
    resolved:       complaints.filter(c => c.status === "resolved").length,
    aiEscalated:    complaints.filter(c => c.priority === "urgent" || c.priority === "high").length,
    slaBreached:    getBreachedComplaints(complaints).length,
    pendingConfirm: complaints.filter(c => c.status === "pending_confirmation").length,
    reopened:       complaints.filter(c => c.status === "reopened").length,
    private:        complaints.filter(c => c.isPrivate).length,
  };

  const filtered = useMemo(() => {
    let list = complaints;
    if (catFilter !== "all") list = list.filter(c => c.category === catFilter);
    if (priFilter !== "all") list = list.filter(c => c.priority === priFilter);
    if (staFilter !== "all") list = list.filter(c => c.status   === staFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.studentName.toLowerCase().includes(q) || c.room.includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "sla")      return (a.sla?.hoursLeft ?? 999) - (b.sla?.hoursLeft ?? 999);
      if (sortBy === "upvotes")  return b.upvotes - a.upvotes;
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "newest")   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    });
  }, [complaints, catFilter, priFilter, staFilter, search, sortBy]);

  const analytics    = computeAnalytics(complaints);
  const breached     = getBreachedComplaints(complaints);

  // Unique rooms for room history picker
  const uniqueRooms = Array.from(new Map(complaints.map(c => [`${c.room}-${c.block}`, { room: c.room, block: c.block }])).values()).sort((a, b) => a.block.localeCompare(b.block) || a.room.localeCompare(b.room));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar name={user.name} role="warden" onLogout={onLogout} />

      {/* Tab bar */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", alignItems: "center", gap: 2, flexShrink: 0, overflowX: "auto" }}>
        {([
          { id: "complaints",  label: "🎫 Complaints"         },
          { id: "analytics",   label: "📊 Analytics"          },
          { id: "students",    label: "👥 Students"           },
          { id: "room_history",label: "🏠 Room History"       },
        ] as { id: WardenTab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === t.id ? "var(--blue-mid)" : "var(--text-3)", borderBottom: `2px solid ${tab === t.id ? "var(--blue-mid)" : "transparent"}`, whiteSpace: "nowrap", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}

        {/* Alert pills */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
          {breached.length > 0 && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#b91c1c", fontWeight: 600 }}>⏱ {breached.length} SLA breached</span>}
          {stats.reopened > 0  && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#b91c1c", fontWeight: 600 }}>🔁 {stats.reopened} reopened</span>}
          {stats.pendingConfirm > 0 && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(3,105,161,.08)", border: "1px solid rgba(3,105,161,.2)", color: "#0369a1", fontWeight: 600 }}>✋ {stats.pendingConfirm} awaiting</span>}
        </div>
      </div>

      {/* Students tab */}
      {tab === "students" && (
        <StudentManager students={students} onUpdate={s => setStudents(s)} />
      )}

      {/* Room history tab */}
      {tab === "room_history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <h2 style={{ fontSize: 22, color: "var(--blue-dark)", marginBottom: 4 }}>Room History</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, fontStyle: "italic" }}>View all complaints filed from a specific room. Repeat issues are flagged automatically.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {uniqueRooms.map(r => (
              <button key={`${r.room}-${r.block}`} onClick={() => setHistoryRoom(r)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'JetBrains Mono'", background: historyRoom?.room === r.room && historyRoom?.block === r.block ? "var(--blue)" : "transparent", border: `1px solid ${historyRoom?.room === r.room && historyRoom?.block === r.block ? "var(--blue)" : "var(--border)"}`, color: historyRoom?.room === r.room && historyRoom?.block === r.block ? "#fff" : "var(--text-2)" }}>
                {r.block}-{r.room}
              </button>
            ))}
          </div>
          {historyRoom ? (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <RoomHistory room={historyRoom.room} block={historyRoom.block} complaints={complaints} />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏠</div>
              <p style={{ fontStyle: "italic" }}>Select a room above to view its complaint history</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === "analytics" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <h2 style={{ fontSize: 22, color: "var(--blue-dark)", marginBottom: 4 }}>Analytics</h2>
          <p style={{ color: "var(--text-3)", marginBottom: 24, fontStyle: "italic", fontSize: 14 }}>Live complaint analytics — updated in real time</p>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total",             val: stats.total,           color: "var(--blue)",      icon: "🎫" },
              { label: "This Week",         val: analytics.totalThisWeek,color:"var(--blue-mid)",  icon: "📅" },
              { label: "Last Week",         val: analytics.totalLastWeek,color:"var(--text-3)",    icon: "📅" },
              { label: "Avg Resolution",    val: `${analytics.avgResolutionHours}h`, color: "#166534", icon: "⚡" },
              { label: "SLA Breach Rate",   val: `${analytics.slaBreachRate}%`, color: analytics.slaBreachRate > 20 ? "#b91c1c" : "#166534", icon: "⏱" },
              { label: "Private Complaints",val: stats.private,         color: "#92400e",          icon: "🔒" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "16px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 12, right: 14, fontSize: 20, opacity: .4 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{s.label}</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: s.color, opacity: .35 }} />
              </div>
            ))}
          </div>

          {/* Insights row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div className="card" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Most Problematic Block</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#b91c1c" }}>Block {analytics.mostProblematicBlock}</p>
            </div>
            <div className="card" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Most Common Issue</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)" }}>{CATEGORY_META[analytics.mostCommonCategory]?.icon} {CATEGORY_META[analytics.mostCommonCategory]?.label}</p>
            </div>
            <div className="card" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Resolution Rate</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#166534" }}>{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</p>
            </div>
          </div>

          {/* Daily chart */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 16 }}>📅 Complaints — Last 7 Days</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
              {analytics.dailyCounts.map(d => {
                const maxVal = Math.max(...analytics.dailyCounts.map(x => x.count), 1);
                const pct    = Math.round((d.count / maxVal) * 100);
                const label  = new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" });
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>{d.count || ""}</span>
                    <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, background: d.count > 0 ? "linear-gradient(180deg, var(--blue-light), var(--blue))" : "var(--cream-dark)", borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height .4s ease" }} />
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* By category */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 14 }}>By Category</h3>
              {(Object.keys(CATEGORY_META) as Category[]).map(k => {
                const count = complaints.filter(c => c.category === k).length;
                if (!count) return null;
                const m = CATEGORY_META[k];
                return (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-2)" }}>{m.icon} {m.label}</span>
                      <span style={{ fontWeight: 600, color: m.color, fontFamily: "'JetBrains Mono'" }}>{count}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: "var(--cream-dark)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / stats.total) * 100}%`, borderRadius: 4, background: m.color, opacity: .7, transition: "width .6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SLA breach queue */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 4 }}>⏱ SLA Queue</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontStyle: "italic" }}>Sorted by deadline — act on red first</p>
              {breached.length === 0 && complaints.filter(c => c.status !== "resolved").length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>All clear 🎉</p>
              )}
              {[...complaints].filter(c => c.status !== "resolved" && c.sla).sort((a, b) => (a.sla?.hoursLeft ?? 999) - (b.sla?.hoursLeft ?? 999)).slice(0, 6).map(c => {
                const sla = slaLabel(c.sla, c.status);
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 7, marginBottom: 5, background: c.sla?.breached ? "rgba(220,38,38,.06)" : "var(--cream)", border: `1px solid ${c.sla?.breached ? "rgba(220,38,38,.2)" : "var(--border)"}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>Room {c.room} · {c.id}</p>
                    </div>
                    <span style={{ fontSize: 11, color: sla.color, fontFamily: "'JetBrains Mono'", fontWeight: 700, marginLeft: 8, whiteSpace: "nowrap" }}>{sla.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Complaints tab */}
      {tab === "complaints" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Filter sidebar */}
          <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
            <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)" }}>
              <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, room, student…" style={{ marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", alignSelf: "center" }}>Sort:</span>
                {([{ k:"sla",label:"⏱ SLA"},{k:"priority",label:"🔴 Priority"},{k:"upvotes",label:"👥 Votes"},{k:"newest",label:"🕐 New"}] as {k:SortBy;label:string}[]).map(s => (
                  <button key={s.k} onClick={() => setSortBy(s.k)} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono'", background: sortBy === s.k ? "var(--blue)" : "transparent", border: `1px solid ${sortBy === s.k ? "var(--blue)" : "var(--border)"}`, color: sortBy === s.k ? "#fff" : "var(--text-3)" }}>{s.label}</button>
                ))}
              </div>
            </div>

            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 5, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Category</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(["all","maintenance","mess","room","wifi","personal","other"] as const).map(c => (
                  <button key={c} onClick={() => setCat(c as any)} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, cursor: "pointer", background: catFilter === c ? "var(--blue)" : "transparent", border: `1px solid ${catFilter === c ? "var(--blue)" : "var(--border)"}`, color: catFilter === c ? "#fff" : "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>
                    {c === "all" ? "All" : `${CATEGORY_META[c]?.icon} ${CATEGORY_META[c]?.label}`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Priority</p>
                {(["all","urgent","high","medium","low"] as const).map(p => (
                  <button key={p} onClick={() => setPri(p)} style={{ display: "block", width: "100%", padding: "3px 8px", borderRadius: 20, fontSize: 10, cursor: "pointer", textAlign: "left", marginBottom: 3, background: priFilter === p ? (p === "all" ? "var(--blue)" : PRIORITY_META[p]?.bg) : "transparent", border: `1px solid ${priFilter === p ? (p === "all" ? "var(--blue)" : PRIORITY_META[p]?.border) : "var(--border)"}`, color: priFilter === p ? (p === "all" ? "#fff" : PRIORITY_META[p]?.color) : "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>
                    {p === "all" ? "All" : PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Status</p>
                {(["all","open","acknowledged","in_progress","pending_confirmation","resolved","reopened"] as const).map(s => (
                  <button key={s} onClick={() => setSta(s)} style={{ display: "block", width: "100%", padding: "3px 8px", borderRadius: 20, fontSize: 10, cursor: "pointer", textAlign: "left", marginBottom: 3, background: staFilter === s ? (s === "all" ? "var(--blue)" : STATUS_META[s]?.bg) : "transparent", border: `1px solid ${staFilter === s ? (s === "all" ? "var(--blue)" : STATUS_META[s]?.border) : "var(--border)"}`, color: staFilter === s ? (s === "all" ? "#fff" : STATUS_META[s]?.color) : "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>
                    {s === "all" ? "All" : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "6px 14px 0" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>{filtered.length} complaint{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }}>
              {filtered.map(c => (
                <ComplaintCard key={c.id} c={c} selected={selected?.id === c.id} isWarden={true} onClick={() => setSelected(c)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                  <p style={{ fontSize: 13, fontStyle: "italic" }}>No complaints match filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {selected
              ? <ComplaintDetail c={selected} isWarden={true} onUpdate={handleUpdate} />
              : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", gap: 10 }}>
                  <div style={{ fontSize: 44, opacity: .25 }}>🏛️</div>
                  <p style={{ fontSize: 15, color: "var(--text-2)" }}>Select a complaint</p>
                  <p style={{ fontSize: 13, fontStyle: "italic" }}>Default sort: SLA deadline</p>
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}
