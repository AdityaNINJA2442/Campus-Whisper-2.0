import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/lib/types";
import { Send } from "lucide-react";

const categories: Category[] = [
  "Hostel Infrastructure", "Electrical Issues", "Internet/IT Issues",
  "Sanitation & Cleaning", "Academic Administration", "Mess/Food Services", "Safety & Security",
];

export default function SubmitPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ text: "", location: "", category: "", studentName: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim() || !form.location.trim() || !form.studentName.trim()) return;
    const params = new URLSearchParams({
      text: form.text,
      location: form.location,
      category: form.category,
      studentName: form.studentName,
    });
    navigate(`/classify?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Submit a Complaint</CardTitle>
          <CardDescription>Describe your issue and our AI system will classify and route it automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" placeholder="e.g., Aarav Mehta" value={form.studentName} onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Complaint Description</Label>
              <Textarea id="text" placeholder="Describe the problem in detail..." rows={5} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Hostel Block A, Room 204" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Category (optional — AI will auto-detect)</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Let AI decide..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="w-full gap-2">
              <Send className="h-4 w-4" /> Analyze & Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
