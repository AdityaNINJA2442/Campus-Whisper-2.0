import { useState, useMemo } from "react";
import type { AuthUser, Complaint, Category, Priority, Status } from "../types";
import { CATEGORY_META, PRIORITY_META, STATUS_META } from "../lib/data";
import { NavBar, ComplaintCard, ComplaintDetail, Pill } from "../components/Shared";

type SortBy = "newest" | "priority" | "status";

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER:   Record<Status, number>   = { open: 0, acknowledged: 1, in_progress: 2, resolved: 3 };

interface Props {
  user: AuthUser;
  onLogout: () => void;
  complaints: Complaint[];
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
}

export function WardenPortal({ user, onLogout, complaints, setComplaints }: Props) {
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [view, setView]         = useState<"list" | "stats">("list");
  const [catFilter, setCat]     = useState<Category | "all">("all");
  const [priFilter, setPri]     = useState<Priority | "all">("all");
  const [staFilter, setSta]     = useState<Status | "all">("all");
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState<SortBy>("priority");

  const handleUpdate = (updated: Complaint) => {
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  };

  const stats = {
    total:       complaints.length,
    urgent:      complaints.filter(c => c.priority === "urgent" && c.status !== "resolved").length,
    open:        complaints.filter(c => c.status === "open").length,
    active:      complaints.filter(c => c.status === "in_progress" || c.status === "acknowledged").length,
    resolved:    complaints.filter(c => c.status === "resolved").length,
    aiEscalated: complaints.filter(c => c.priority === "urgent" || c.priority === "high").length,
  };

  const filtered = useMemo(() => {
    let list = complaints;
    if (catFilter !== "all") list = list.filter(c => c.category === catFilter);
    if (priFilter !== "all") list = list.filter(c => c.priority === priFilter);
    if (staFilter !== "all") list = list.filter(c => c.status === staFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.room.includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "status")   return STATUS_ORDER[a.status]   - STATUS_ORDER[b.status];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [complaints, catFilter, priFilter, staFilter, search, sortBy]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar name={user.name} role="warden" onLogout={onLogout} />

      {/* Sub-nav */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex", alignItems: "center", gap: 4,
        flexShrink: 0,
      }}>
        {(["list", "stats"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            color: view === v ? "var(--blue-mid)" : "var(--text-3)",
            borderBottom: `2px solid ${view === v ? "var(--blue-mid)" : "transparent"}`,
            transition: "all .15s",
          }}>
            {v === "list" ? "🎫 All Complaints" : "📊 Overview"}
          </button>
        ))}
        {stats.urgent > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)" }}>
            <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>⚠️ {stats.urgent} urgent</span>
          </div>
        )}
      </div>

      {view === "stats" ? (
        <StatsView complaints={complaints} stats={stats} />
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Filter sidebar */}
          <div style={{
            width: 380, flexShrink: 0,
            display: "flex", flexDirection: "column",
            borderRight: "1px solid var(--border)",
            background: "var(--surface)",
          }}>
            {/* Search + sort */}
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border)" }}>
              <input className="inp" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, room, student…" style={{ marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>Sort:</span>
                {(["priority", "newest", "status"] as SortBy[]).map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                    fontFamily: "'JetBrains Mono'", textTransform: "capitalize",
                    background: sortBy === s ? "var(--blue)" : "transparent",
                    border: `1px solid ${sortBy === s ? "var(--blue)" : "var(--border)"}`,
                    color: sortBy === s ? "#fff" : "var(--text-3)",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6, fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: ".05em" }}>Category</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {(["all", "maintenance", "mess", "room", "wifi", "other"] as const).map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                    background: catFilter === c ? "var(--blue)" : "transparent",
                    border: `1px solid ${catFilter === c ? "var(--blue)" : "var(--border)"}`,
                    color: catFilter === c ? "#fff" : "var(--text-3)",
                    fontFamily: "'JetBrains Mono'",
                  }}>
                    {c === "all" ? "All" : `${CATEGORY_META[c as Category].icon} ${CATEGORY_META[c as Category].label}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority + status filters */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Priority</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(["all", "urgent", "high", "medium", "low"] as const).map(p => (
                    <button key={p} onClick={() => setPri(p)} style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", textAlign: "left",
                      background: priFilter === p ? (p === "all" ? "var(--blue)" : PRIORITY_META[p]?.bg) : "transparent",
                      border: `1px solid ${priFilter === p ? (p === "all" ? "var(--blue)" : PRIORITY_META[p]?.border) : "var(--border)"}`,
                      color: priFilter === p ? (p === "all" ? "#fff" : PRIORITY_META[p]?.color) : "var(--text-3)",
                      fontFamily: "'JetBrains Mono'",
                    }}>{p === "all" ? "All" : PRIORITY_META[p].label}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5, fontFamily: "'JetBrains Mono'", textTransform: "uppercase" }}>Status</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(["all", "open", "acknowledged", "in_progress", "resolved"] as const).map(s => (
                    <button key={s} onClick={() => setSta(s)} style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", textAlign: "left",
                      background: staFilter === s ? (s === "all" ? "var(--blue)" : STATUS_META[s]?.bg) : "transparent",
                      border: `1px solid ${staFilter === s ? (s === "all" ? "var(--blue)" : STATUS_META[s]?.border) : "var(--border)"}`,
                      color: staFilter === s ? (s === "all" ? "#fff" : STATUS_META[s]?.color) : "var(--text-3)",
                      fontFamily: "'JetBrains Mono'",
                    }}>{s === "all" ? "All" : STATUS_META[s].label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Count */}
            <div style={{ padding: "8px 14px 0", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>
                {filtered.length} complaint{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }}>
              {filtered.map(c => (
                <ComplaintCard key={c.id} c={c} selected={selected?.id === c.id}
                  onClick={() => setSelected(c)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-3)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                  <p style={{ fontSize: 13, fontStyle: "italic" }}>No complaints match filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {selected
              ? <ComplaintDetail c={selected} isWarden={true} onUpdate={handleUpdate} />
              : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", gap: 10 }}>
                  <div style={{ fontSize: 44, opacity: .25 }}>🏛️</div>
                  <p style={{ fontSize: 15, color: "var(--text-2)" }}>Select a complaint</p>
                  <p style={{ fontSize: 13, fontStyle: "italic" }}>Use filters on the left to narrow down</p>
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}

function StatsView({ complaints, stats }: { complaints: Complaint[]; stats: any }) {
  const byCat = (Object.keys(CATEGORY_META) as Category[]).map(k => ({
    key: k, ...CATEGORY_META[k],
    count: complaints.filter(c => c.category === k).length,
  }));
  const byPri = (["urgent", "high", "medium", "low"] as Priority[]).map(k => ({
    key: k, ...PRIORITY_META[k],
    count: complaints.filter(c => c.priority === k).length,
  }));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <h2 style={{ fontSize: 22, color: "var(--blue-dark)", marginBottom: 4 }}>Overview</h2>
      <p style={{ color: "var(--text-3)", marginBottom: 24, fontStyle: "italic", fontSize: 14 }}>
        AI-powered complaint analytics
      </p>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Complaints",    val: stats.total,        color: "var(--blue)",     icon: "🎫" },
          { label: "Urgent / Unresolved", val: stats.urgent,       color: "#b91c1c",         icon: "🚨" },
          { label: "AI Escalated",        val: stats.aiEscalated,  color: "var(--gold-dark)", icon: "🤖" },
          { label: "Open",                val: stats.open,         color: "var(--blue-mid)", icon: "📬" },
          { label: "In Progress",         val: stats.active,       color: "var(--gold-dark)", icon: "⚡" },
          { label: "Resolved",            val: stats.resolved,     color: "#166534",         icon: "✅" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 12, right: 14, fontSize: 20, opacity: .4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{s.label}</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: s.color, opacity: .35 }} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* By category */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 14 }}>By Category</h3>
          {byCat.filter(b => b.count > 0).map(b => (
            <div key={b.key} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-2)" }}>{b.icon} {b.label}</span>
                <span style={{ fontWeight: 600, color: b.color, fontFamily: "'JetBrains Mono'" }}>{b.count}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "var(--cream-dark)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(b.count / stats.total) * 100}%`, borderRadius: 4, background: b.color, opacity: .7, transition: "width .6s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* By priority */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 14 }}>By Priority</h3>
          {byPri.filter(b => b.count > 0).map(b => (
            <div key={b.key} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-2)" }}>{b.label}</span>
                <span style={{ fontWeight: 600, color: b.color, fontFamily: "'JetBrains Mono'" }}>{b.count}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "var(--cream-dark)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(b.count / stats.total) * 100}%`, borderRadius: 4, background: b.color, transition: "width .6s ease" }} />
              </div>
            </div>
          ))}

          {/* Resolution rate */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "var(--text-2)" }}>Resolution Rate</span>
              <span style={{ fontWeight: 700, color: "#166534", fontFamily: "'JetBrains Mono'" }}>
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "var(--cream-dark)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`, borderRadius: 5, background: "#166534", transition: "width .8s ease" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}