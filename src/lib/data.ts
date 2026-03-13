import type { Complaint, Priority, Category } from "../types";

// ── Lightweight AI Engine ────────────────────────────────────────────────────
// No API calls. Pure keyword scoring — works even offline.

const URGENT_WORDS = ["flood", "flooded", "fire", "smoke", "gas", "leak", "electric shock", "no water", "no electricity", "power cut", "sewage", "overflow", "burst", "broken window", "emergency", "dangerous", "unsafe", "injury", "hurt", "collapsed"];
const HIGH_WORDS = ["not working", "broken", "damaged", "stuck", "no hot water", "cockroach", "rat", "rodent", "pest", "mold", "mould", "fungus", "foul smell", "smell", "food poisoning", "sick", "ill", "fever", "theft", "stolen", "missing", "locked out"];
const MEDIUM_WORDS = ["slow", "intermittent", "sometimes", "request", "change", "repair", "fix", "dirty", "unclean", "cold food", "delay", "complaint", "issue", "problem", "poor", "bad", "wrong"];

const CAT_KEYWORDS: Record<Category, string[]> = {
  maintenance: ["plumbing", "pipe", "tap", "flush", "toilet", "bathroom", "fan", "light", "bulb", "furniture", "door", "lock", "window", "roof", "ceiling", "wall", "paint", "floor", "drain", "water", "electricity", "wiring", "switch", "socket", "ac", "cooler"],
  mess:        ["food", "mess", "meal", "lunch", "dinner", "breakfast", "canteen", "cook", "roti", "rice", "dal", "hygiene", "plate", "utensil", "menu", "vegetable", "quality", "taste", "stale", "raw"],
  room:        ["room", "roommate", "allot", "allocate", "change room", "transfer", "block", "floor", "bed", "mattress", "cupboard", "almirah", "hostel fee", "occupancy", "single", "double", "sharing"],
  wifi:        ["wifi", "wi-fi", "internet", "network", "connection", "speed", "slow internet", "no internet", "disconnected", "router", "bandwidth", "lag", "signal"],
  other:       ["noise", "loud", "disturbance", "security", "guard", "gate", "curfew", "late", "pass", "permission", "fees", "receipt", "certificate", "id card"],
};

export function analyzeComplaint(title: string, description: string, cat: Category): { priority: Priority; tags: string[]; note: string } {
  const text = (title + " " + description).toLowerCase();

  // Priority
  let priority: Priority = "low";
  const foundUrgent = URGENT_WORDS.filter(w => text.includes(w));
  const foundHigh   = HIGH_WORDS.filter(w => text.includes(w));
  const foundMedium = MEDIUM_WORDS.filter(w => text.includes(w));

  if (foundUrgent.length > 0) priority = "urgent";
  else if (foundHigh.length > 0) priority = "high";
  else if (foundMedium.length >= 2) priority = "medium";

  // Tags — up to 4, deduplicated
  const catWords = CAT_KEYWORDS[cat] || [];
  const matched = catWords.filter(w => text.includes(w));
  const extra = [...foundUrgent, ...foundHigh].slice(0, 2);
  const tags = [...new Set([...matched.slice(0, 2), ...extra])].slice(0, 4);

  // AI note
  let note = "";
  if (priority === "urgent")  note = `⚠️ Urgent issue detected — immediate warden attention required. Keywords: "${foundUrgent.slice(0,2).join('", "')}"`;
  else if (priority === "high") note = `This complaint appears high-priority. Suggested resolution within 24 hours.`;
  else if (priority === "medium") note = `Routine complaint, moderate priority. Suggested resolution within 3 days.`;
  else note = `Low-priority request. Can be scheduled in the next weekly round.`;

  return { priority, tags, note };
}

// ── Demo accounts ────────────────────────────────────────────────────────────
export const ACCOUNTS = [
  { id: "s001", name: "Arjun Sharma",      role: "student" as const, room: "204", block: "A" },
  { id: "s002", name: "Priya Nair",        role: "student" as const, room: "310", block: "B" },
  { id: "s003", name: "Rohan Mehta",       role: "student" as const, room: "105", block: "A" },
  { id: "s004", name: "Sneha Reddy",       role: "student" as const, room: "212", block: "C" },
  { id: "s005", name: "Karan Patel",       role: "student" as const, room: "318", block: "B" },
  { id: "s006", name: "Anjali Singh",      role: "student" as const, room: "401", block: "D" },
  { id: "s007", name: "Vikram Yadav",      role: "student" as const, room: "116", block: "A" },
  { id: "s008", name: "Meera Iyer",        role: "student" as const, room: "225", block: "C" },
  { id: "s009", name: "Aditya Banerjee",   role: "student" as const, room: "307", block: "B" },
  { id: "s010", name: "Pooja Kulkarni",    role: "student" as const, room: "412", block: "D" },
  { id: "s011", name: "Rahul Gupta",       role: "student" as const, room: "108", block: "A" },
  { id: "s012", name: "Divya Menon",       role: "student" as const, room: "320", block: "C" },
  { id: "w001", name: "Mr. R. K. Verma",  role: "warden" as const },
];

// ── Seed complaints ──────────────────────────────────────────────────────────
const d = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

export const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "CMP-001",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "maintenance", title: "Water leaking from bathroom ceiling",
    description: "The bathroom ceiling has a severe leak since last night. Water is pooling on the floor and may cause electric hazard near the light fitting.",
    status: "open", priority: "urgent",
    aiTags: ["leak", "electric", "water", "ceiling"],
    aiNote: '⚠️ Urgent issue detected — immediate warden attention required. Keywords: "leak", "electric"',
    createdAt: d(2), updatedAt: d(2),
  },
  {
    id: "CMP-002",
    studentId: "s002", studentName: "Priya Nair", room: "310", block: "B",
    category: "mess", title: "Food quality very poor — stale dal served",
    description: "Dinner last night had stale dal. Many students felt uneasy after eating. This is not the first time poor quality food has been served.",
    status: "acknowledged", priority: "high",
    aiTags: ["stale", "food", "quality"],
    aiNote: "This complaint appears high-priority. Suggested resolution within 24 hours.",
    createdAt: d(18), updatedAt: d(10),
    wardenNote: "Mess supervisor informed. Will audit kitchen tomorrow morning.",
  },
  {
    id: "CMP-003",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "wifi", title: "Wi-Fi disconnects every 30 minutes",
    description: "Internet keeps dropping in Block A rooms above the 2nd floor. Very difficult to attend online classes. Issue ongoing for 5 days.",
    status: "in_progress", priority: "high",
    aiTags: ["wifi", "internet", "disconnected"],
    aiNote: "This complaint appears high-priority. Suggested resolution within 24 hours.",
    createdAt: d(120), updatedAt: d(24),
    wardenNote: "IT team has been contacted. Router replacement scheduled.",
  },
  {
    id: "CMP-004",
    studentId: "s002", studentName: "Priya Nair", room: "310", block: "B",
    category: "room", title: "Request for room change — Block B 3rd floor",
    description: "My current roommate and I have schedule conflicts. Requesting a transfer to any available single room in Block B or C.",
    status: "open", priority: "low",
    aiTags: ["room", "change", "transfer"],
    aiNote: "Low-priority request. Can be scheduled in the next weekly round.",
    createdAt: d(48), updatedAt: d(48),
  },
  {
    id: "CMP-005",
    studentId: "s001", studentName: "Arjun Sharma", room: "204", block: "A",
    category: "maintenance", title: "Ceiling fan not working in room 204",
    description: "The ceiling fan in my room has stopped working. It is very hot and affecting sleep and studies. Please repair or replace at the earliest.",
    status: "resolved", priority: "medium",
    aiTags: ["fan", "ceiling", "repair"],
    aiNote: "Routine complaint, moderate priority. Suggested resolution within 3 days.",
    createdAt: d(200), updatedAt: d(50),
    resolvedAt: d(50),
    wardenNote: "Fan repaired by maintenance staff.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  maintenance: { label: "Maintenance",    icon: "🔧", color: "#1a3a6e" },
  mess:        { label: "Mess / Food",    icon: "🍽️", color: "#7c2d12" },
  room:        { label: "Room",           icon: "🚪", color: "#166534" },
  wifi:        { label: "Wi-Fi",          icon: "📶", color: "#4c1d95" },
  other:       { label: "Other",          icon: "📋", color: "#374151" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: "Urgent",  color: "#b91c1c", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)"  },
  high:   { label: "High",    color: "#c2410c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.22)"  },
  medium: { label: "Medium",  color: "#92400e", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)"  },
  low:    { label: "Low",     color: "#166534", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"   },
};

export const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  open:        { label: "Open",        color: "#1a3a6e", bg: "rgba(26,58,110,0.08)",  border: "rgba(26,58,110,0.2)"  },
  acknowledged:{ label: "Acknowledged",color: "#6b21a8", bg: "rgba(109,40,217,0.08)",border: "rgba(109,40,217,0.2)" },
  in_progress: { label: "In Progress", color: "#92400e", bg: "rgba(201,168,76,0.12)",border: "rgba(201,168,76,0.3)" },
  resolved:    { label: "Resolved",    color: "#166534", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.2)"  },
};
