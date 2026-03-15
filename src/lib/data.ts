import type { Complaint, Priority, Category, SLAInfo, Status, Student, AnalyticsData } from "../types";

// ── AI Engine ────────────────────────────────────────────────────────────────
const URGENT_WORDS = ["flood","flooded","fire","smoke","gas","leak","electric shock","no water","no electricity","power cut","sewage","overflow","burst","broken window","emergency","dangerous","unsafe","injury","hurt","collapsed"];
const HIGH_WORDS   = ["not working","broken","damaged","stuck","no hot water","cockroach","rat","rodent","pest","mold","mould","fungus","foul smell","food poisoning","sick","ill","fever","theft","stolen","missing","locked out"];
const MEDIUM_WORDS = ["slow","intermittent","sometimes","request","change","repair","fix","dirty","unclean","cold food","delay","complaint","issue","problem","poor","bad","wrong"];

const CAT_KEYWORDS: Record<string, string[]> = {
  maintenance: ["plumbing","pipe","tap","flush","toilet","bathroom","fan","light","bulb","furniture","door","lock","window","roof","ceiling","wall","paint","floor","drain","water","electricity","wiring","switch","socket","ac","cooler"],
  mess:        ["food","mess","meal","lunch","dinner","breakfast","canteen","cook","roti","rice","dal","hygiene","plate","utensil","menu","vegetable","quality","taste","stale","raw"],
  room:        ["room","roommate","allot","allocate","change room","transfer","block","floor","bed","mattress","cupboard","almirah","hostel fee","occupancy","single","double","sharing"],
  wifi:        ["wifi","wi-fi","internet","network","connection","speed","slow internet","no internet","disconnected","router","bandwidth","lag","signal"],
  personal:    ["personal","private","sensitive","conflict","harassment","bully","threat","mental","stress","health"],
  other:       ["noise","loud","disturbance","security","guard","gate","curfew","late","pass","permission","fees","receipt","certificate","id card"],
};

const SLA_HOURS: Record<Priority, number> = { urgent: 4, high: 24, medium: 72, low: 168 };

export function buildSLA(priority: Priority, createdAt: string): SLAInfo {
  const hours      = SLA_HOURS[priority];
  const deadlineAt = new Date(new Date(createdAt).getTime() + hours * 3600000).toISOString();
  const msLeft     = new Date(deadlineAt).getTime() - Date.now();
  return {
    deadlineHours: hours,
    deadlineAt,
    breached:   msLeft < 0,
    hoursLeft:  Math.max(0, Math.floor(msLeft / 3600000)),
  };
}

export function analyzeComplaint(title: string, description: string, cat: Category) {
  const text = (title + " " + description).toLowerCase();
  let priority: Priority = "low";
  const foundUrgent = URGENT_WORDS.filter(w => text.includes(w));
  const foundHigh   = HIGH_WORDS.filter(w => text.includes(w));
  const foundMedium = MEDIUM_WORDS.filter(w => text.includes(w));
  if (foundUrgent.length > 0)      priority = "urgent";
  else if (foundHigh.length > 0)   priority = "high";
  else if (foundMedium.length >= 2) priority = "medium";
  const catWords = CAT_KEYWORDS[cat] || [];
  const matched  = catWords.filter(w => text.includes(w));
  const extra    = [...foundUrgent, ...foundHigh].slice(0, 2);
  const tags     = [...new Set([...matched.slice(0, 2), ...extra])].slice(0, 4);
  let note = "";
  if      (priority === "urgent") note = `⚠️ Urgent — immediate attention required. Keywords: "${foundUrgent.slice(0,2).join('", "')}"`;
  else if (priority === "high")   note = `High-priority. Suggested resolution within 24 hours.`;
  else if (priority === "medium") note = `Moderate priority. Suggested resolution within 3 days.`;
  else                            note = `Low-priority. Can be scheduled in the next weekly round.`;
  return { priority, tags, note };
}

// ── Duplicate detection ───────────────────────────────────────────────────────
function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (!wa.size || !wb.size) return 0;
  let common = 0;
  wa.forEach(w => { if (wb.has(w)) common++; });
  return common / Math.max(wa.size, wb.size);
}

export function findDuplicate(title: string, category: Category, existing: Complaint[]): Complaint | null {
  const cutoff = Date.now() - 24 * 3600000;
  for (const c of existing) {
    if (c.category === category && new Date(c.createdAt).getTime() > cutoff && c.status !== "resolved" && !c.duplicateOf) {
      if (similarity(title, c.title) >= 0.4) return c;
    }
  }
  return null;
}

// ── Problem 9: Rate limiting ──────────────────────────────────────────────────
const dailyCountsMap: Record<string, number> = {};

function todayKey(studentId: string) {
  return `${studentId}_${new Date().toISOString().slice(0, 10)}`;
}

export function getComplaintCountToday(studentId: string): number {
  return dailyCountsMap[todayKey(studentId)] || 0;
}

export function incrementComplaintCount(studentId: string): void {
  const key = todayKey(studentId);
  dailyCountsMap[key] = (dailyCountsMap[key] || 0) + 1;
}

export const MAX_COMPLAINTS_PER_DAY = 3;

// ── Problem 5: Receipt generator ─────────────────────────────────────────────
export function generateReceiptId(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CW-${ts}-${rand}`;
}

export function printReceipt(c: Complaint): void {
  const win = window.open("", "_blank", "width=600,height=700");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Complaint Receipt — ${c.receiptId}</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; color: #0d1f3c; max-width: 520px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #c9a84c; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 32px; margin-bottom: 8px; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        .subtitle { color: #6b82a8; font-size: 14px; }
        .receipt-id { font-family: monospace; font-size: 20px; font-weight: bold; color: #1a3a6e; background: #e8edf5; padding: 10px 20px; border-radius: 8px; display: inline-block; margin: 16px 0; }
        .field { margin-bottom: 12px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b82a8; margin-bottom: 3px; }
        .value { font-size: 15px; color: #0d1f3c; }
        .priority-urgent { color: #b91c1c; font-weight: bold; }
        .priority-high { color: #c2410c; font-weight: bold; }
        .priority-medium { color: #92400e; font-weight: bold; }
        .priority-low { color: #166534; font-weight: bold; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8edf5; font-size: 12px; color: #6b82a8; text-align: center; }
        .watermark { font-size: 11px; color: #c8d3e8; text-align: center; margin-top: 8px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏛️</div>
        <h1>Campus Whisper</h1>
        <div class="subtitle">Official Complaint Receipt</div>
      </div>

      <div style="text-align:center">
        <div class="receipt-id">${c.receiptId}</div>
      </div>

      <div class="field"><div class="label">Complaint ID</div><div class="value">${c.id}</div></div>
      <div class="field"><div class="label">Filed By</div><div class="value">${c.studentName}</div></div>
      <div class="field"><div class="label">Room / Block</div><div class="value">Room ${c.room}, Block ${c.block}</div></div>
      <div class="field"><div class="label">Category</div><div class="value">${c.category.charAt(0).toUpperCase() + c.category.slice(1)}</div></div>
      <div class="field"><div class="label">Subject</div><div class="value">${c.title}</div></div>
      <div class="field"><div class="label">Priority (AI Assessed)</div><div class="value class="priority-${c.priority}">${c.priority.toUpperCase()}</div></div>
      <div class="field"><div class="label">SLA Deadline</div><div class="value">${new Date(c.sla.deadlineAt).toLocaleString()}</div></div>
      <div class="field"><div class="label">Submitted At</div><div class="value">${new Date(c.createdAt).toLocaleString()}</div></div>

      <div class="footer">
        This receipt is proof that your complaint was officially registered in the Campus Whisper Hostel Grievance System.
        Keep this receipt ID for future reference.
      </div>
      <div class="watermark">Generated automatically · Cannot be altered</div>

      <br/>
      <button onclick="window.print()" style="width:100%;padding:12px;background:#1a3a6e;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;margin-top:8px;">
        🖨️ Print / Save as PDF
      </button>
    </body>
    </html>
  `);
  win.document.close();
}

// ── Problem 12: Analytics ────────────────────────────────────────────────────
export function computeAnalytics(complaints: Complaint[]): AnalyticsData {
  const now       = Date.now();
  const weekMs    = 7 * 86400000;
  const thisWeek  = complaints.filter(c => now - new Date(c.createdAt).getTime() < weekMs);
  const lastWeek  = complaints.filter(c => {
    const age = now - new Date(c.createdAt).getTime();
    return age >= weekMs && age < weekMs * 2;
  });

  // Avg resolution hours
  const resolved = complaints.filter(c => c.resolvedAt);
  const avgRes   = resolved.length === 0 ? 0 : Math.round(
    resolved.reduce((acc, c) => acc + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 3600000, 0) / resolved.length
  );

  // Most problematic block
  const blockCounts: Record<string, number> = {};
  complaints.forEach(c => { blockCounts[c.block] = (blockCounts[c.block] || 0) + 1; });
  const mostProblematicBlock = Object.entries(blockCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Most common category
  const catCounts: Record<string, number> = {};
  complaints.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });
  const mostCommonCategory = (Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other") as Category;

  // SLA breach rate
  const breached     = complaints.filter(c => c.sla?.breached && c.status !== "resolved").length;
  const slaBreachRate = complaints.length === 0 ? 0 : Math.round((breached / complaints.length) * 100);

  // Daily counts last 7 days
  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(now - i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const count = complaints.filter(c => c.createdAt.slice(0, 10) === date).length;
    return { date, count };
  }).reverse();

  return { totalThisWeek: thisWeek.length, totalLastWeek: lastWeek.length, avgResolutionHours: avgRes, mostProblematicBlock, mostCommonCategory, slaBreachRate, dailyCounts };
}

// ── Problem 10: SLA breach check ─────────────────────────────────────────────
export function getBreachedComplaints(complaints: Complaint[]): Complaint[] {
  return complaints.filter(c => c.sla?.breached && c.status !== "resolved" && c.status !== "pending_confirmation");
}

// ── Student store ────────────────────────────────────────────────────────────
export let STUDENT_STORE: Student[] = [
  { id: "s001", name: "Arjun Sharma",    email: "arjun@hostel.edu",   room: "204", block: "A", rollNumber: "CS2001", isActive: true, joinedAt: "2024-07-01" },
  { id: "s002", name: "Priya Nair",      email: "priya@hostel.edu",   room: "310", block: "B", rollNumber: "CS2002", isActive: true, joinedAt: "2024-07-01" },
  { id: "s003", name: "Rohan Mehta",     email: "rohan@hostel.edu",   room: "105", block: "A", rollNumber: "CS2003", isActive: true, joinedAt: "2024-07-01" },
  { id: "s004", name: "Sneha Reddy",     email: "sneha@hostel.edu",   room: "212", block: "C", rollNumber: "CS2004", isActive: true, joinedAt: "2024-07-01" },
  { id: "s005", name: "Karan Patel",     email: "karan@hostel.edu",   room: "318", block: "B", rollNumber: "CS2005", isActive: true, joinedAt: "2024-07-01" },
  { id: "s006", name: "Anjali Singh",    email: "anjali@hostel.edu",  room: "401", block: "D", rollNumber: "CS2006", isActive: true, joinedAt: "2024-07-01" },
  { id: "s007", name: "Vikram Yadav",    email: "vikram@hostel.edu",  room: "116", block: "A", rollNumber: "CS2007", isActive: true, joinedAt: "2024-07-01" },
  { id: "s008", name: "Meera Iyer",      email: "meera@hostel.edu",   room: "225", block: "C", rollNumber: "CS2008", isActive: true, joinedAt: "2024-07-01" },
  { id: "s009", name: "Aditya Banerjee", email: "aditya@hostel.edu",  room: "307", block: "B", rollNumber: "CS2009", isActive: true, joinedAt: "2024-07-01" },
  { id: "s010", name: "Pooja Kulkarni",  email: "pooja@hostel.edu",   room: "412", block: "D", rollNumber: "CS2010", isActive: true, joinedAt: "2024-07-01" },
  { id: "s011", name: "Rahul Gupta",     email: "rahul@hostel.edu",   room: "108", block: "A", rollNumber: "CS2011", isActive: true, joinedAt: "2024-07-01" },
  { id: "s012", name: "Divya Menon",     email: "divya@hostel.edu",   room: "320", block: "C", rollNumber: "CS2012", isActive: true, joinedAt: "2024-07-01" },
];

export function addStudent(s: Student): void {
  STUDENT_STORE = [...STUDENT_STORE, s];
}

export function updateStudent(s: Student): void {
  STUDENT_STORE = STUDENT_STORE.map(x => x.id === s.id ? s : x);
}

export function removeStudent(id: string): void {
  STUDENT_STORE = STUDENT_STORE.map(s => s.id === id ? { ...s, isActive: false } : s);
}

// ── Accounts for login ───────────────────────────────────────────────────────
export function getAccounts() {
  return [
    ...STUDENT_STORE.filter(s => s.isActive).map(s => ({
      id: s.id, name: s.name, role: "student" as const,
      room: s.room, block: s.block, email: s.email,
    })),
    { id: "w001", name: "Mr. R. K. Verma", role: "warden" as const, email: "warden@hostel.edu" },
  ];
}

// ── Seed complaints ───────────────────────────────────────────────────────────
const d = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

export const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "CMP-001", receiptId: "CW-M1A2B3-XY9Z",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "maintenance", title: "Water leaking from bathroom ceiling",
    description: "Severe leak since last night. Water pooling near light fitting — electric hazard.",
    status: "open", priority: "urgent", isPrivate: false,
    aiTags: ["leak","electric","water","ceiling"],
    aiNote: '⚠️ Urgent — immediate attention required. Keywords: "leak", "electric"',
    createdAt: d(2), updatedAt: d(2),
    sla: buildSLA("urgent", d(2)),
    upvotes: 1, resolutionRejectedCount: 0,
  },
  {
    id: "CMP-002", receiptId: "CW-M1A2B3-AB1C",
    studentId: "s002", studentName: "Priya Nair", room: "310", block: "B",
    category: "mess", title: "Food quality very poor — stale dal served",
    description: "Dinner last night had stale dal. Many students felt uneasy after eating.",
    status: "acknowledged", priority: "high", isPrivate: false,
    aiTags: ["stale","food","quality"],
    aiNote: "High-priority. Suggested resolution within 24 hours.",
    createdAt: d(18), updatedAt: d(10),
    wardenNote: "Mess supervisor informed. Kitchen audit tomorrow morning.",
    sla: buildSLA("high", d(18)),
    upvotes: 3, resolutionRejectedCount: 0,
  },
  {
    id: "CMP-003", receiptId: "CW-M1A2B3-CD2E",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "wifi", title: "Wi-Fi disconnects every 30 minutes in Block A",
    description: "Internet drops in Block A rooms above 2nd floor. Hard to attend online classes. 5 days ongoing.",
    status: "in_progress", priority: "high", isPrivate: false,
    aiTags: ["wifi","internet","disconnected"],
    aiNote: "High-priority. Suggested resolution within 24 hours.",
    createdAt: d(120), updatedAt: d(24),
    wardenNote: "IT team contacted. Router replacement scheduled.",
    sla: buildSLA("high", d(120)),
    upvotes: 5, resolutionRejectedCount: 0,
  },
  {
    id: "CMP-004", receiptId: "CW-M1A2B3-EF3G",
    studentId: "s002", studentName: "Priya Nair", room: "310", block: "B",
    category: "room", title: "Request for room change — Block B 3rd floor",
    description: "My roommate and I have schedule conflicts. Requesting transfer to Block B or C.",
    status: "open", priority: "low", isPrivate: false,
    aiTags: ["room","change","transfer"],
    aiNote: "Low-priority. Can be scheduled in the next weekly round.",
    createdAt: d(48), updatedAt: d(48),
    sla: buildSLA("low", d(48)),
    upvotes: 1, resolutionRejectedCount: 0,
  },
  {
    id: "CMP-005", receiptId: "CW-M1A2B3-GH4I",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "maintenance", title: "Ceiling fan not working in room 204",
    description: "Fan stopped working. Very hot, affecting sleep and studies.",
    status: "pending_confirmation", priority: "medium", isPrivate: false,
    aiTags: ["fan","ceiling","repair"],
    aiNote: "Moderate priority. Suggested resolution within 3 days.",
    createdAt: d(200), updatedAt: d(3),
    resolutionNote: `Maintenance staff visited Room 204 on ${new Date(Date.now() - 3 * 36e5).toLocaleDateString()}. Fan motor replaced with new unit.`,
    sla: buildSLA("medium", d(200)),
    upvotes: 1, resolutionRejectedCount: 0,
  },
  {
    id: "CMP-006", receiptId: "CW-M1A2B3-IJ5K",
    studentId: "s003", studentName: "Rohan Mehta", room: "105", block: "A",
    category: "personal", title: "Personal issue — room conflict",
    description: "Sensitive matter regarding roommate behaviour. Prefer warden-only visibility.",
    status: "open", priority: "high", isPrivate: true,
    aiTags: ["personal","conflict"],
    aiNote: "High-priority personal complaint. Marked private — only warden can see details.",
    createdAt: d(6), updatedAt: d(6),
    sla: buildSLA("high", d(6)),
    upvotes: 1, resolutionRejectedCount: 0,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function slaLabel(sla: SLAInfo, status: Status): { text: string; color: string } {
  if (status === "resolved") return { text: "Resolved ✓", color: "#166534" };
  if (sla?.breached)         return { text: "SLA Breached!", color: "#b91c1c" };
  if (sla?.hoursLeft <= 2)   return { text: `${sla.hoursLeft}h left`, color: "#b91c1c" };
  if (sla?.hoursLeft <= 8)   return { text: `${sla.hoursLeft}h left`, color: "#c2410c" };
  if (sla?.hoursLeft <= 24)  return { text: `${sla.hoursLeft}h left`, color: "#92400e" };
  return { text: `${sla?.hoursLeft ?? "?"}h left`, color: "#166534" };
}

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  maintenance: { label: "Maintenance", icon: "🔧", color: "#1a3a6e" },
  mess:        { label: "Mess / Food", icon: "🍽️", color: "#7c2d12" },
  room:        { label: "Room",        icon: "🚪", color: "#166534" },
  wifi:        { label: "Wi-Fi",       icon: "📶", color: "#4c1d95" },
  personal:    { label: "Personal",    icon: "🔒", color: "#92400e" },
  other:       { label: "Other",       icon: "📋", color: "#374151" },
};

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: "Urgent", color: "#b91c1c", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)" },
  high:   { label: "High",   color: "#c2410c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.22)" },
  medium: { label: "Medium", color: "#92400e", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)" },
  low:    { label: "Low",    color: "#166534", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
};

export const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:                 { label: "Open",            color: "#1a3a6e", bg: "rgba(26,58,110,0.08)",  border: "rgba(26,58,110,0.2)"  },
  acknowledged:         { label: "Acknowledged",    color: "#6b21a8", bg: "rgba(109,40,217,0.08)", border: "rgba(109,40,217,0.2)" },
  in_progress:          { label: "In Progress",     color: "#92400e", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)" },
  pending_confirmation: { label: "Awaiting Student",color: "#0369a1", bg: "rgba(3,105,161,0.08)",  border: "rgba(3,105,161,0.2)"  },
  resolved:             { label: "Resolved",        color: "#166534", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
  reopened:             { label: "Reopened",        color: "#b91c1c", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)"  },
};
