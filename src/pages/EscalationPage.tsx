import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { escalationLevels } from "@/lib/data";
import { getComplaints } from "@/lib/store";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { AlertTriangle, ArrowUp, Clock, Shield } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

export default function EscalationPage() {
  const complaints = useMemo(() => getComplaints(), []);
  const escalated = complaints.filter(c => c.status === "Escalated" || c.escalationLevel > 1);
  const overdue = complaints.filter(c => c.status !== "Resolved" && new Date(c.deadline) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escalation System</h1>
        <p className="text-muted-foreground">Unresolved complaints are automatically escalated through the hierarchy.</p>
      </div>

      {/* Escalation ladder */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Escalation Hierarchy</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {escalationLevels.map((lvl, i) => (
              <div key={lvl.level} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border bg-card p-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {lvl.level}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{lvl.title}</p>
                    <p className="text-xs text-muted-foreground">{lvl.authority}</p>
                  </div>
                </div>
                {i < escalationLevels.length - 1 && (
                  <ArrowUp className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Escalated */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--status-escalated))]" />
              <CardTitle className="text-lg">Escalated Complaints ({escalated.length})</CardTitle>
            </div>
            <CardDescription>Complaints that have been escalated to higher authorities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {escalated.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No escalated complaints 🎉</p>}
            {escalated.map(c => (
              <div key={c.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <span className="ml-auto text-xs font-semibold text-[hsl(var(--status-escalated))]">
                    <Shield className="inline h-3 w-3 mr-1" />Level {c.escalationLevel}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{c.text}</p>
                <p className="text-xs text-muted-foreground">{c.department} • {c.studentName}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[hsl(var(--status-assigned))]" />
              <CardTitle className="text-lg">Overdue Complaints ({overdue.length})</CardTitle>
            </div>
            <CardDescription>Complaints past their resolution deadline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No overdue complaints 🎉</p>}
            {overdue.map(c => (
              <div key={c.id} className="rounded-lg border border-destructive/30 p-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <p className="text-sm line-clamp-2">{c.text}</p>
                <p className="text-xs text-destructive font-medium">
                  Overdue by {formatDistanceToNow(new Date(c.deadline))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
