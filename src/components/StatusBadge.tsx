import { ComplaintStatus, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cls: Record<ComplaintStatus, string> = {
    Submitted: "status-submitted",
    Assigned: "status-assigned",
    "In Progress": "status-in-progress",
    Resolved: "status-resolved",
    Escalated: "status-escalated",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cls[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cls: Record<Priority, string> = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
    Critical: "priority-critical",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", cls[priority])}>
      {priority}
    </span>
  );
}
