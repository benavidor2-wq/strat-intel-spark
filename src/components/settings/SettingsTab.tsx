import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = ["Preferences"] as const;
type Section = typeof SECTIONS[number];

export function SettingsTab() {
  const [section, setSection] = useState<Section>("Preferences");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card p-3">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={cn("rounded-lg px-3 py-2 text-left text-sm transition-colors",
              section === s ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted")}>
            {s}
          </button>
        ))}
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground"><LogOut size={14} className="mr-2" />Log out</Button>
        </div>
      </aside>
      <section className="flex-1 overflow-y-auto p-8">
        <h1 className="mb-6 text-2xl font-extrabold tracking-display">{section}</h1>
        {section === "Preferences" && (
          <div className="max-w-xl space-y-4">
            <SettingRow label="Email notifications" desc="Receive alerts for new CFO insights."><Switch defaultChecked /></SettingRow>
            <SettingRow label="Weekly spend report" desc="A summary emailed every Monday."><Switch defaultChecked /></SettingRow>
            <SettingRow label="Dark mode" desc="Match your system or choose a theme.">
              <Button size="sm" variant="outline" onClick={toggleDark}>
                {dark ? <Sun size={14} className="mr-1" /> : <Moon size={14} className="mr-1" />}{dark ? "Light" : "Dark"}
              </Button>
            </SettingRow>
            <SettingRow label="Currency" desc="Default display currency.">
              <Select defaultValue="USD">
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{["USD", "EUR", "ILS", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Language" desc="Interface language.">
              <Select defaultValue="English">
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{["English", "Spanish", "French", "German", "Italian", "Portuguese", "Hebrew", "Dutch", "Japanese"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </SettingRow>
            <div>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Integrations</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {["QuickBooks", "Xero", "Google Drive", "Slack"].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <span className="text-sm font-medium">{i}</span>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
