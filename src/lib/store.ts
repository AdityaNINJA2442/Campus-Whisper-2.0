import { Complaint, ComplaintStatus, TimelineEntry } from "./types";
import { sampleComplaints } from "./data";

const STORAGE_KEY = "college_complaints";

function load(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const data = [...sampleComplaints];
  save(data);
  return data;
}

function save(complaints: Complaint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

export function getComplaints(): Complaint[] {
  return load();
}

export function getComplaint(id: string): Complaint | undefined {
  return load().find(c => c.id === id);
}

export function addComplaint(complaint: Complaint): void {
  const list = load();
  list.unshift(complaint);
  save(list);
}

export function updateStatus(id: string, status: ComplaintStatus, note: string): void {
  const list = load();
  const c = list.find(c => c.id === id);
  if (!c) return;
  c.status = status;
  const entry: TimelineEntry = { date: new Date().toISOString(), status, note };
  c.timeline.push(entry);
  if (status === "Escalated") c.escalationLevel = Math.min(c.escalationLevel + 1, 4);
  save(list);
}

export function resetData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
