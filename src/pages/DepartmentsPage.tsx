import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { departments, categoryToDepartment } from "@/lib/data";
import { getComplaints } from "@/lib/store";
import { Building2, Mail, User, FolderOpen } from "lucide-react";
import { useMemo } from "react";

export default function DepartmentsPage() {
  const complaints = useMemo(() => getComplaints(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Department Routing</h1>
        <p className="text-muted-foreground">Complaints are automatically routed to the correct department based on AI classification.</p>
      </div>

      {/* Routing diagram */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Routing Logic</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(categoryToDepartment).map(([cat, dept]) => (
              <div key={cat} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{cat}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-accent font-semibold">{dept}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map(dept => {
          const count = complaints.filter(c => c.department === dept.name).length;
          const active = complaints.filter(c => c.department === dept.name && c.status !== "Resolved").length;
          return (
            <Card key={dept.name} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{dept.head}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{dept.email}</span>
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t">
                  <div><span className="text-lg font-bold text-foreground">{count}</span><span className="text-xs text-muted-foreground ml-1">total</span></div>
                  <div><span className="text-lg font-bold text-[hsl(var(--status-in-progress))]">{active}</span><span className="text-xs text-muted-foreground ml-1">active</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
