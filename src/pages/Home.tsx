import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// CLAUDE_NOTE: Single-user local auth. This app is built for the owner only —
// no backend auth, no Supabase, no multi-user support. Credentials below are
// hardcoded and gate the dashboard via a sessionStorage flag ("invoiciify_auth").
// To change the login, edit AUTH_USER / AUTH_PASS. Do not re-introduce Supabase
// auth or a signup flow without an explicit request.
const AUTH_USER = "admin";
const AUTH_PASS = "invoiciify";
const AUTH_KEY = "invoiciify_auth";

type Tab = "canvas" | "library" | "mycfo" | "settings";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "canvas", label: "Canvas", Icon: LayoutDashboard },
  { id: "library", label: "Library", Icon: BookOpen },
  { id: "mycfo", label: "MyCFO", Icon: BrainCircuit },
];

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (username === AUTH_USER && password === AUTH_PASS) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onSuccess();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-3">
          <Link to="/"><Logo /></Link>
          <h1 className="text-lg font-semibold">Sign in</h1>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full">Log in</Button>
      </form>
    </div>
  );
}

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("canvas");
  const [unreadCount] = useState(cfoMessages.filter((m) => m.unread).length);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
  }, []);

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

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
          <Button size="icon" variant="ghost" onClick={logout} title="Log out"><LogOut size={18} /></Button>
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
