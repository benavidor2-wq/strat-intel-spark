import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoogleDriveCard } from "@/components/settings/GoogleDriveCard";

export function SettingsTab() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <section className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-display">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your preferences and data connections.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Preferences</h2>
              <div className="space-y-3">
                <SettingRow label="Email notifications" desc="Receive alerts for new CFO insights."><Switch defaultChecked /></SettingRow>
                <SettingRow label="Weekly spend report" desc="A summary emailed every Monday."><Switch defaultChecked /></SettingRow>
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
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Integrations</h2>
              <GoogleDriveCard />
            </div>
          </div>
        </div>
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
