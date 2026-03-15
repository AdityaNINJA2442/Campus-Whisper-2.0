import { useState } from "react";
import type { Student } from "../types";
import { addStudent, updateStudent, removeStudent } from "../lib/data";

export function StudentManager({ students, onUpdate }: { students: Student[]; onUpdate: (s: Student[]) => void }) {
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState<Student | null>(null);
  const [adding, setAdding]     = useState(false);
  const [form, setForm]         = useState<Partial<Student>>({});
  const [saving, setSaving]     = useState(false);
  const [filterBlock, setBlock] = useState("all");

  const blocks = ["all", ...Array.from(new Set(students.map(s => s.block))).sort()];

  const visible = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.room.includes(q);
    const matchBlock  = filterBlock === "all" || s.block === filterBlock;
    return matchSearch && matchBlock;
  });

  const startAdd = () => {
    setForm({ isActive: true, joinedAt: new Date().toISOString().slice(0, 10) });
    setAdding(true); setEditing(null);
  };

  const startEdit = (s: Student) => {
    setForm({ ...s }); setEditing(s); setAdding(false);
  };

  const save = async () => {
    if (!form.name?.trim() || !form.room?.trim() || !form.block?.trim() || !form.rollNumber?.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (adding) {
      const newS: Student = {
        id: `s${String(Date.now()).slice(-4)}`,
        name: form.name.trim(),
        email: form.email?.trim() || `${form.rollNumber?.toLowerCase()}@hostel.edu`,
        room: form.room.trim(),
        block: form.block.trim().toUpperCase(),
        rollNumber: form.rollNumber!.trim().toUpperCase(),
        isActive: true,
        joinedAt: form.joinedAt || new Date().toISOString().slice(0, 10),
      };
      addStudent(newS);
      onUpdate([...students, newS]);
    } else if (editing) {
      const updated: Student = { ...editing, ...form } as Student;
      updateStudent(updated);
      onUpdate(students.map(s => s.id === updated.id ? updated : s));
    }
    setAdding(false); setEditing(null); setForm({});
    setSaving(false);
  };

  const deactivate = (s: Student) => {
    if (!confirm(`Remove ${s.name} from the hostel system?`)) return;
    removeStudent(s.id);
    onUpdate(students.map(x => x.id === s.id ? { ...x, isActive: false } : x));
  };

  const reactivate = (s: Student) => {
    const updated = { ...s, isActive: true };
    updateStudent(updated);
    onUpdate(students.map(x => x.id === s.id ? updated : x));
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, color: "var(--blue-dark)", marginBottom: 4 }}>Student Management</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
            {students.filter(s => s.isActive).length} active · {students.filter(s => !s.isActive).length} inactive
          </p>
        </div>
        <button className="btn btn-gold" onClick={startAdd} style={{ fontSize: 13 }}>+ Add Student</button>
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div className="card" style={{ padding: "20px", marginBottom: 20, borderLeft: "4px solid var(--gold)" }}>
          <h3 style={{ fontSize: 15, color: "var(--blue-dark)", marginBottom: 16 }}>{adding ? "Add New Student" : `Edit — ${editing?.name}`}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              { key: "name",       label: "Full Name *",    placeholder: "e.g. Rahul Sharma"     },
              { key: "rollNumber", label: "Roll Number *",  placeholder: "e.g. CS2025"           },
              { key: "email",      label: "Email",          placeholder: "auto-generated if empty"},
              { key: "room",       label: "Room Number *",  placeholder: "e.g. 204"              },
              { key: "block",      label: "Block *",        placeholder: "e.g. A"                },
              { key: "joinedAt",   label: "Join Date",      placeholder: "YYYY-MM-DD",  type: "date" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>{f.label}</label>
                <input className="inp" type={f.type ?? "text"} value={(form as any)[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" disabled={saving || !form.name?.trim() || !form.room?.trim() || !form.block?.trim() || !form.rollNumber?.trim()} onClick={save} style={{ fontSize: 13 }}>
              {saving ? "Saving…" : adding ? "Add Student →" : "Save Changes →"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setAdding(false); setEditing(null); setForm({}); }} style={{ fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll number, room…" style={{ flex: 1, minWidth: 200 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {blocks.map(b => (
            <button key={b} onClick={() => setBlock(b)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono'", background: filterBlock === b ? "var(--blue)" : "transparent", border: `1px solid ${filterBlock === b ? "var(--blue)" : "var(--border)"}`, color: filterBlock === b ? "#fff" : "var(--text-3)" }}>
              {b === "all" ? "All" : `Block ${b}`}
            </button>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                {["Name", "Roll No.", "Room", "Block", "Email", "Joined", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--cream)", opacity: s.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "'JetBrains Mono'", color: "var(--text-2)" }}>{s.rollNumber}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-2)" }}>{s.room}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: "rgba(26,58,110,.08)", color: "var(--blue)", border: "1px solid rgba(26,58,110,.2)", fontFamily: "'JetBrains Mono'" }}>Block {s.block}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)" }}>{s.email}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)", fontFamily: "'JetBrains Mono'" }}>{s.joinedAt}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 10, background: s.isActive ? "rgba(22,163,74,.1)" : "rgba(100,116,139,.1)", color: s.isActive ? "#166534" : "#475569", border: `1px solid ${s.isActive ? "rgba(22,163,74,.25)" : "rgba(100,116,139,.25)"}`, fontFamily: "'JetBrains Mono'" }}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => startEdit(s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: "rgba(26,58,110,.07)", border: "1px solid rgba(26,58,110,.2)", color: "var(--blue)" }}>Edit</button>
                      {s.isActive
                        ? <button onClick={() => deactivate(s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", color: "#b91c1c" }}>Remove</button>
                        : <button onClick={() => reactivate(s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.2)", color: "#166534" }}>Restore</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontStyle: "italic" }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
