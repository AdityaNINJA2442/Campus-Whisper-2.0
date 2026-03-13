import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, GitBranch, AlertTriangle, Plus } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/submit", label: "Submit Complaint", icon: Plus },
  { to: "/departments", label: "Departments", icon: GitBranch },
  { to: "/escalation", label: "Escalation", icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none font-[family-name:var(--font-heading)]">CampusResolve</h1>
              <p className="text-xs text-muted-foreground">Complaint Management System</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
