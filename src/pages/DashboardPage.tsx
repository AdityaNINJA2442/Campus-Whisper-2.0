import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { getComplaints, updateStatus, resetData } from "@/lib/store";
import { Complaint, ComplaintStatus } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { Search, RefreshCw, AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, ChevronUp, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";

const statuses: ComplaintStatus[] = ["Submitted", "Assigned", "In Progress", "Resolved", "Escalated"];

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(getComplaints);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => setComplaints(getComplaints());

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search && !`${c.text} ${c.id} ${c.location} ${c.studentName}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [complaints, search, statusFilter]);

  const stats = useMemo(() => ({
    total: complaints.length,
    submitted: complaints.filter(c => c.status === "Submitted").length,
    inProgress: complaints.filter(c => c.status === "In Progress" || c.status === "Assigned").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    escalated: complaints.filter(c => c.status === "Escalated").length,
  }), [complaints]);

  const handleStatusChange = (id: string, newStatus: ComplaintStatus) => {
    updateStatus(id, newStatus, `Status changed to ${newStatus}`);
    refresh();
    toast.success(`Complaint ${id} updated to ${newStatus}`);
  };

  const handleReset = () => {
    resetData();
    refresh();
    toast.info("Demo data restored");
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "Pending", value: stats.submitted, icon: Clock, color: "text-[hsl(var(--status-submitted))]" },
    { label: "Active", value: stats.inProgress, icon: RefreshCw, color: "text-[hsl(var(--status-in-progress))]" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-[hsl(var(--status-resolved))]" },
    { label: "Escalated", value: stats.escalated, icon: AlertTriangle, color: "text-[hsl(var(--status-escalated))]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complaint Dashboard</h1>
          <p className="text-muted-foreground">Track and manage all campus complaints</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-1 h-3 w-3" /> Reset Demo
          </Button>
          <Link to="/submit"><Button size="sm">+ New Complaint</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search complaints..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <button className="w-full text-left" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{c.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{c.department}</span>
                    <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {expanded === c.id ? <ChevronUp className="h-5 w-5 text-muted-foreground mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground mt-1" />}
              </CardContent>
            </button>

            {expanded === c.id && (
              <div className="border-t bg-muted/30 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><span className="text-muted-foreground">Student:</span> <span className="font-medium">{c.studentName}</span></div>
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{c.category}</span></div>
                  <div><span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{format(new Date(c.deadline), "PP")}</span></div>
                  <div><span className="text-muted-foreground">Escalation:</span> <span className="font-medium">Level {c.escalationLevel}</span></div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-sm font-semibold mb-2">Timeline</p>
                  <div className="relative space-y-3 pl-6 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border">
                    {c.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                        <div className="text-xs text-muted-foreground">{format(new Date(t.date), "PPp")}</div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={t.status} />
                          <span className="text-sm">{t.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {c.status !== "Resolved" && (
                  <div className="flex flex-wrap gap-2">
                    {c.status === "Submitted" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, "Assigned")}>Mark Assigned</Button>}
                    {c.status === "Assigned" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, "In Progress")}>Start Progress</Button>}
                    {c.status === "In Progress" && <Button size="sm" onClick={() => handleStatusChange(c.id, "Resolved")}>Resolve</Button>}
                    {c.status !== "Escalated" && (
                      <Button size="sm" variant="destructive" onClick={() => handleStatusChange(c.id, "Escalated")}>Escalate</Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No complaints found matching your filters.</div>
        )}
      </div>
    </div>
  );
}
