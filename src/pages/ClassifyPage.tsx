import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { classifyComplaint } from "@/lib/classifier";
import { generateId } from "@/lib/data";
import { addComplaint } from "@/lib/store";
import { Category, ClassificationResult, Complaint } from "@/lib/types";
import { Brain, CheckCircle, Tag, Building2, Gauge, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function ClassifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [animating, setAnimating] = useState(true);
  const [saved, setSaved] = useState(false);

  const text = params.get("text") || "";
  const location = params.get("location") || "";
  const manualCategory = params.get("category") as Category | "";
  const studentName = params.get("studentName") || "Student";

  useEffect(() => {
    const timer = setTimeout(() => {
      const r = classifyComplaint(text, location);
      if (manualCategory) r.category = manualCategory as Category;
      setResult(r);
      setAnimating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [text, location, manualCategory]);

  const handleConfirm = () => {
    if (!result) return;
    const complaint: Complaint = {
      id: generateId(),
      text, location, studentName,
      category: result.category,
      department: result.department,
      priority: result.priority,
      deadline: result.deadline,
      status: "Submitted",
      createdAt: new Date().toISOString(),
      escalationLevel: 1,
      timeline: [{ date: new Date().toISOString(), status: "Submitted", note: "Complaint registered via AI classification" }],
    };
    addComplaint(complaint);
    setSaved(true);
    setTimeout(() => navigate("/"), 1000);
  };

  if (animating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <Brain className="h-16 w-16 text-primary animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20" />
        </div>
        <p className="text-lg font-semibold text-foreground">AI is analyzing your complaint...</p>
        <p className="text-sm text-muted-foreground">Detecting keywords, assigning category & priority</p>
      </div>
    );
  }

  if (!result) return null;

  const infoItems = [
    { icon: Tag, label: "Category", value: result.category },
    { icon: Building2, label: "Department", value: result.department },
    { icon: Gauge, label: "Priority", value: result.priority, badge: <PriorityBadge priority={result.priority} /> },
    { icon: Clock, label: "Deadline", value: format(new Date(result.deadline), "PPP") },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-primary/30">
        <CardHeader className="flex flex-row items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <CardTitle>AI Classification Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Original Complaint</p>
            <p className="text-foreground">{text}</p>
            <p className="mt-1 text-xs text-muted-foreground">📍 {location}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Detected Keywords</p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map(kw => (
                <span key={kw} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{kw}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Confidence: {Math.round(result.confidence * 100)}%</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {infoItems.map(item => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {item.badge || <p className="text-sm font-semibold text-foreground">{item.value}</p>}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleConfirm} disabled={saved} size="lg" className="w-full gap-2">
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved! Redirecting...</> : <><ArrowRight className="h-4 w-4" /> Confirm & Submit</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
