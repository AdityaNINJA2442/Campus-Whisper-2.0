export type ComplaintStatus = "Submitted" | "Assigned" | "In Progress" | "Resolved" | "Escalated";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type Category =
  | "Hostel Infrastructure"
  | "Electrical Issues"
  | "Internet/IT Issues"
  | "Sanitation & Cleaning"
  | "Academic Administration"
  | "Mess/Food Services"
  | "Safety & Security";

export type DepartmentName =
  | "Maintenance Department"
  | "Electrical Department"
  | "IT Department"
  | "Cleaning & Sanitation"
  | "Examination Cell"
  | "Mess Management"
  | "Security"
  | "Student Affairs";

export interface Department {
  name: DepartmentName;
  head: string;
  email: string;
  categories: Category[];
}

export interface EscalationLevel {
  level: number;
  title: string;
  authority: string;
}

export interface Complaint {
  id: string;
  text: string;
  category: Category;
  location: string;
  department: DepartmentName;
  priority: Priority;
  deadline: string;
  status: ComplaintStatus;
  createdAt: string;
  studentName: string;
  escalationLevel: number;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  date: string;
  status: ComplaintStatus;
  note: string;
}

export interface ClassificationResult {
  category: Category;
  department: DepartmentName;
  priority: Priority;
  deadline: string;
  keywords: string[];
  confidence: number;
}
