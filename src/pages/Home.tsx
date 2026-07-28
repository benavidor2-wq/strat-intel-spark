// CLAUDE_NOTE: /app is auth-gated. This component checks for a Supabase
// session on mount and redirects unauthenticated visitors back to "/".
// The header exposes a Sign out button that clears the Supabase session.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, BookOpen, BrainCircuit, Upload, Save, Settings as SettingsIcon, LogOut } from "lucide-react";
import { CanvasTab } from "@/components/canvas/CanvasTab";
import Glassmorphism from "@/components/designs/Glassmorphism";
import { LibraryTab } from "@/components/library/LibraryTab";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { NotificationBell } from "@/components/NotificationBell";
import { AIChatBubble } from "@/components/AIChatBubble";
import { cn } from "@/lib/utils";
import { cfoMessages } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";

type Tab = "canvas" | "library" | "mycfo" | "settings";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "canvas", label: "Canvas", Icon: LayoutDashboard },
  { id: "library", label: "Library", Icon: BookOpen },
  { id: "mycfo", label: "MyCFO", Icon: BrainCircuit },
];

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("canvas");
  const [unreadCount, setUnreadCount] = useState(cfoMessages.filter((m) => m.unread).length);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/", { replace: true });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }


  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Link to="/"><Logo /></Link>
          <Separator orientation="vertical" className="h-7" />
          <nav className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <Icon size={14} />{label}
                {id === "mycfo" && unreadCount > 0 && (
                  <>
                    <span className="ml-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping-slow rounded-full bg-red-500/70" />
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {tab === "canvas" && (
            <>
              <Button variant="outline" size="sm"><Upload size={14} className="mr-1" />Upload Invoice</Button>
              <Button size="sm"><Save size={14} className="mr-1" />Save</Button>
              <Button variant="ghost" size="sm">Save as New</Button>
            </>
          )}
          <NotificationBell />
          <Button size="icon" variant="ghost" onClick={() => setTab("settings")}><SettingsIcon size={18} /></Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {tab === "canvas" && <CanvasTab />}
        {tab === "library" && <LibraryTab onEdit={() => setTab("canvas")} />}
        {tab === "mycfo" && <div className="flex-1 overflow-y-auto"><Glassmorphism /></div>}
        {tab === "settings" && <SettingsTab />}
      </main>

      <AIChatBubble />
    </div>
  );
}
