export type Role = "student" | "warden";

export type Category =
  | "maintenance"
  | "mess"
  | "room"
  | "wifi"
  | "other"
  | "personal"; // Problem 11 — private category

export type Priority = "low" | "medium" | "high" | "urgent";

export type Status =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "pending_confirmation"
  | "resolved"
  | "reopened";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  room?: string;
  block?: string;
  email?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  room: string;
  block: string;
  rollNumber: string;
  isActive: boolean;
  joinedAt: string;
}

export interface SLAInfo {
  deadlineHours: number;
  deadlineAt: string;
  breached: boolean;
  hoursLeft: number;
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
  sla: SLAInfo;

  // Problem 11 — private flag
  isPrivate: boolean;

  // Problem 4/5 — receipt
  receiptId: string;

  // Resolution
  resolutionNote?: string;
  resolvedAt?: string;
  wardenNote?: string;

  // Problem 2 — student confirmation
  studentConfirmed?: boolean;
  studentRejectedAt?: string;
  resolutionRejectedCount: number;

  // Problem 1 — duplicate grouping
  upvotes: number;
  groupId?: string;
  duplicateOf?: string;
}

// Problem 12 — analytics snapshot
export interface AnalyticsData {
  totalThisWeek: number;
  totalLastWeek: number;
  avgResolutionHours: number;
  mostProblematicBlock: string;
  mostCommonCategory: Category;
  slaBreachRate: number;
  dailyCounts: { date: string; count: number }[];
}
