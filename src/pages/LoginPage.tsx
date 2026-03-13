import { useState } from "react";
import type { AuthUser } from "../types";
import { ACCOUNTS } from "../lib/data";

export function LoginPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [roll, setRoll]   = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    await new Promise(r => setTimeout(r, 700));
    // Simple demo auth — roll number = id, password = "hostel"
    const acc = ACCOUNTS.find(a => a.id === roll.toLowerCase().trim() && pass === "hostel");
    if (acc) onLogin(acc as AuthUser);
    else setErr("Invalid credentials. Use IDs: s001 / s002 / w001, password: hostel");
    setBusy(false);
  };

  const quick = (id: string) => {
    const acc = ACCOUNTS.find(a => a.id === id)!;
    onLogin(acc as AuthUser);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: 1,
        background: `linear-gradient(160deg, var(--blue-deep) 0%, var(--blue-dark) 55%, var(--blue) 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative rings */}
        {[260, 380, 500].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            width: s, height: s,
            borderRadius: "50%",
            border: "1px solid rgba(201,168,76,0.08)",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
        ))}

        <div className="au" style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 380 }}>
          {/* Crest */}
          <div style={{
            width: 80, height: 80,
            margin: "0 auto 24px",
            borderRadius: 20,
            background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38,
            boxShadow: "0 6px 28px rgba(201,168,76,.35)",
          }}>🏛️</div>

          <h1 style={{
            fontFamily: "'Tiro Devanagari Hindi', serif",
            fontSize: 34, color: "#fff",
            lineHeight: 1.15, marginBottom: 8,
          }}>
            Hostel<br />
            <span style={{ color: "var(--gold-light)" }}>Grievance Portal</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15, fontStyle: "italic", marginBottom: 40 }}>
            Your complaints, resolved faster with AI.
          </p>

          {[
            { icon: "🤖", text: "AI auto-prioritises every complaint" },
            { icon: "⚡", text: "Instant routing to the warden" },
            { icon: "📊", text: "Track your complaint in real-time" },
          ].map((f, i) => (
            <div key={i} className="au" style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(201,168,76,.13)",
              borderRadius: 10, padding: "11px 16px",
              marginBottom: 10, textAlign: "left",
              animationDelay: `${.15 + i * .1}s`,
            }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,.72)", fontSize: 14 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        width: 440,
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 44px",
        boxShadow: "-16px 0 48px rgba(0,0,0,.22)",
      }}>
        <div className="au" style={{ animationDelay: ".1s" }}>
          <p style={{ fontSize: 12, color: "var(--gold-dark)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
            ⚜ College Hostel
          </p>
          <h2 style={{ fontSize: 26, color: "var(--blue-dark)", marginBottom: 4 }}>Sign In</h2>
          <p style={{ color: "var(--text-3)", marginBottom: 28, fontSize: 14 }}>
            Students & Warden access
          </p>

          {/* Quick demo */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "'JetBrains Mono'" }}>
              Quick demo
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "s001", label: "👤 Student" },
                { id: "w001", label: "🛡 Warden" },
              ].map(b => (
                <button key={b.id} className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }}
                  onClick={() => quick(b.id)}>{b.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>or</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
          </div>

          <form onSubmit={go}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Roll No. / Warden ID
            </label>
            <input className="inp" value={roll} onChange={e => setRoll(e.target.value)}
              placeholder="e.g. s001" required style={{ marginBottom: 14 }} />

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Password
            </label>
            <input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" required style={{ marginBottom: 20 }} />

            {err && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
                {err}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-gold" style={{ width: "100%", fontSize: 15 }}>
              {busy ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
            IDs: s001 / s002 / w001 &nbsp;·&nbsp; password: <span className="mono">hostel</span>
          </p>
        </div>
      </div>
    </div>
  );
}
