import { Category, ClassificationResult, DepartmentName, Priority } from "./types";
import { categoryToDepartment } from "./data";

interface KeywordRule {
  keywords: string[];
  category: Category;
  priorityBoost?: boolean;
}

const rules: KeywordRule[] = [
  { keywords: ["wifi", "internet", "network", "router", "lan", "bandwidth", "connectivity", "online"], category: "Internet/IT Issues" },
  { keywords: ["projector", "computer", "laptop", "printer", "software", "server", "it"], category: "Internet/IT Issues" },
  { keywords: ["electricity", "power", "fan", "ac", "air conditioner", "wiring", "switch", "bulb", "light", "ups", "voltage", "circuit"], category: "Electrical Issues", priorityBoost: true },
  { keywords: ["leak", "plumbing", "pipe", "crack", "wall", "ceiling", "door", "window", "furniture", "chair", "desk", "roof", "cooler", "tap", "water tank"], category: "Hostel Infrastructure" },
  { keywords: ["toilet", "bathroom", "cleaning", "garbage", "dustbin", "smell", "hygiene", "sanitation", "sweep", "mop", "dirty"], category: "Sanitation & Cleaning" },
  { keywords: ["food", "mess", "canteen", "meal", "breakfast", "lunch", "dinner", "dal", "rice", "insect", "cockroach", "quality", "menu", "timing"], category: "Mess/Food Services" },
  { keywords: ["exam", "result", "grade", "marks", "semester", "admit card", "hall ticket", "revaluation", "academic"], category: "Academic Administration" },
  { keywords: ["security", "theft", "cctv", "guard", "gate", "stray", "dog", "unsafe", "parking", "bike", "vehicle"], category: "Safety & Security" },
];

const urgencyKeywords = ["dangerous", "emergency", "urgent", "immediately", "unbearable", "unsafe", "critical", "broken glass", "fire", "shards", "theft"];
const highKeywords = ["not working", "broken", "leakage", "insects", "peeling", "deteriorated", "wobbling"];

export function classifyComplaint(text: string, location: string): ClassificationResult {
  const lower = (text + " " + location).toLowerCase();

  let bestCategory: Category = "Hostel Infrastructure";
  let maxScore = 0;
  let matchedKeywords: string[] = [];

  for (const rule of rules) {
    const matched = rule.keywords.filter(kw => lower.includes(kw));
    let score = matched.length;
    if (rule.priorityBoost && score > 0) score += 0.5;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = rule.category;
      matchedKeywords = matched;
    }
  }

  // Priority
  let priority: Priority = "Low";
  const hasUrgent = urgencyKeywords.some(kw => lower.includes(kw));
  const hasHigh = highKeywords.some(kw => lower.includes(kw));

  if (hasUrgent) priority = "Critical";
  else if (hasHigh) priority = "High";
  else if (maxScore >= 2) priority = "Medium";

  // Deadline based on priority
  const deadlineDays = { Low: 10, Medium: 5, High: 3, Critical: 1 };
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays[priority]);

  const department: DepartmentName = categoryToDepartment[bestCategory];
  const confidence = Math.min(0.95, 0.5 + maxScore * 0.12);

  return {
    category: bestCategory,
    department,
    priority,
    deadline: deadline.toISOString(),
    keywords: matchedKeywords,
    confidence,
  };
}
