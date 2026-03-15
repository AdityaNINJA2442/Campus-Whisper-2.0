import { useState } from "react";
import type { AuthUser, Complaint } from "../types";
import { NavBar, ComplaintCard, ComplaintDetail } from "../components/Shared";
import { NewComplaintForm } from "../components/NewComplaintForm";
import { RoomHistory } from "../components/RoomHistory";

type View = "list" | "new" | "detail" | "history";

interface Props {
  user: AuthUser;
  onLogout: () => void;
  complaints: Complaint[];
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
}

export function StudentPortal({ user, onLogout, complaints, setComplaints }: Props) {
  const myComplaints = complaints.filter(c => c.studentId === user.id);
  const [view, setView]         = useState<View>("list");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [filter, setFilter]     = useState("all");

  const filtered = myComplaints.filter(c => filter === "all" || c.status === filter);

  const stats = {
    open:     myComplaints.filter(c => c.status === "open").length,
    active:   myComplaints.filter(c => c.status === "acknowledged" || c.status === "in_progress").length,
    resolved: myComplaints.filter(c => c.status === "resolved").length,
    pending:  myComplaints.filter(c => c.status === "pending_confirmation").length,
  };

  const handleNew = (c: Complaint) => {
    const exists = complaints.find(x => x.id === c.id);
    if (exists) setComplaints(prev => prev.map(x => x.id === c.id ? c : x));
    else setComplaints(prev => [c, ...prev]);
    setSelected(c);
    setView("detail");
  };

  const handleUpdate = (updated: Complaint) => {
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar name={user.name} role="student" onLogout={onLogout}
        onNew={() => { setView("new"); setSelected(null); }} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 360, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>

          {/* Student info */}
          <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--blue), var(--blue-mid))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Room {user.room} · Block {user.block}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {[
                { label: "Open",    val: stats.open,    color: "var(--blue)"     },
                { label: "Active",  val: stats.active,  color: "var(--gold-dark)" },
                { label: "Confirm", val: stats.pending, color: "#0369a1"         },
                { label: "Done",    val: stats.resolved,color: "#166534"         },
              ].map(s => (
                <div key={s.label} style={{ padding: "8px 6px", borderRadius: 8, background: "var(--cream)", border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-nav tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
            {[
              { v: "list",    label: "My Complaints" },
              { v: "history", label: "Room History"  },
            ].map(t => (
              <button key={t.v} onClick={() => setView(t.v as View)} style={{ flex: 1, padding: "9px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: (view === t.v || (view === "detail" && t.v === "list")) ? "var(--blue-mid)" : "var(--text-3)", borderBottom: `2px solid ${(view === t.v || (view === "detail" && t.v === "list")) ? "var(--blue-mid)" : "transparent"}`, transition: "all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter pills */}
          {view !== "history" && (
            <div style={{ padding: "8px 12px", display: "flex", gap: 5, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
              {["all","open","acknowledged","in_progress","pending_confirmation","resolved","reopened"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", background: filter === f ? "var(--blue)" : "transparent", border: `1px solid ${filter === f ? "var(--blue)" : "var(--border)"}`, color: filter === f ? "#fff" : "var(--text-3)" }}>
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {view === "history" ? (
              <RoomHistory room={user.room ?? "—"} block={user.block ?? "—"} complaints={complaints} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-3)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <p style={{ fontSize: 14, fontStyle: "italic" }}>{filter === "all" ? "No complaints yet." : `No ${filter} complaints.`}</p>
                {filter === "all" && <button className="btn btn-primary" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setView("new")}>Submit first complaint</button>}
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                {filtered.map(c => (
                  <ComplaintCard key={c.id} c={c} selected={selected?.id === c.id}
                    onClick={() => { setSelected(c); setView("detail"); }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main pane */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {view === "new" ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
              <NewComplaintForm user={user} allComplaints={complaints} onSubmit={handleNew} onCancel={() => setView(selected ? "detail" : "list")} />
            </div>
          ) : selected && view === "detail" ? (
            <ComplaintDetail c={selected} isWarden={false} onUpdate={handleUpdate} />
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", gap: 12 }}>
              <div style={{ fontSize: 52, opacity: .3 }}>🏛️</div>
              <h3 style={{ fontSize: 18, color: "var(--text-2)" }}>Select a complaint to view</h3>
              <p style={{ fontSize: 14, fontStyle: "italic" }}>Or raise a new complaint using the button above</p>
              <button className="btn btn-gold" style={{ marginTop: 8 }} onClick={() => setView("new")}>+ New Complaint</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
