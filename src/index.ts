export type Role = "student" | "warden";

export type Category =
  | "maintenance"
  | "mess"
  | "room"
  | "wifi"
  | "other";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "open" | "acknowledged" | "in_progress" | "resolved";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  room?: string;   // students only
  block?: string;  // students only
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  room: string;
  block: string;
  category: Category;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  aiTags: string[];
  aiNote: string;
  createdAt: string;
  updatedAt: string;
  wardenNote?: string;
  resolvedAt?: string;
}
