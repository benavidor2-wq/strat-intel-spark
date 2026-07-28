import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// CLAUDE_NOTE (data source)
// Notifications are UI-only today (empty from dataSource). When you wire
// this to Supabase, back it with a `notifications` table scoped to the
// signed-in user via RLS; keep the shape defined in @/lib/dataSource.
import { notifications } from "@/lib/dataSource";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function NotificationBell() {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => n.unread).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="text-sm font-bold">Notifications</div>
          <button className="text-[11px] text-primary hover:underline" onClick={() => setItems(items.map((n) => ({ ...n, unread: false })))}>Mark all read</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-2 border-b border-border/60 p-3 last:border-0">
              {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${n.unread ? "font-semibold" : ""}`}>{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.body}</div>
                <div className="mt-0.5 text-[10px] uppercase text-muted-foreground">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
