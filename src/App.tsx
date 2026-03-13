import { useState } from "react";
import type { AuthUser, Complaint } from "./types";
import { LoginPage }     from "./pages/LoginPage";
import { StudentPortal } from "./pages/StudentPortal";
import { WardenPortal }  from "./pages/WardenPortal";
import { SEED_COMPLAINTS } from "./lib/data";
import "./index.css";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS);

  if (!user) return <LoginPage onLogin={setUser} />;

  if (user.role === "warden") return (
    <WardenPortal
      user={user}
      complaints={complaints}
      setComplaints={setComplaints}
      onLogout={() => setUser(null)}
    />
  );

  return (
    <StudentPortal
      user={user}
      complaints={complaints}
      setComplaints={setComplaints}
      onLogout={() => setUser(null)}
    />
  );
}