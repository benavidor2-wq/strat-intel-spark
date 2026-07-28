import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<null | "build" | "support">(null);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: "Got it — here's a suggested visualization to start with." }]);
    setText("");
  };

  return (
    <>
      <button
        aria-label="Open AI assistant"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105",
        )}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="glass-widget fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 bg-card/60 p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles size={14} /></div>
              <div>
                <div className="text-sm font-bold">Invoiciify Assistant</div>
                <div className="text-[10px] text-muted-foreground">Ask anything about your data</div>
              </div>
            </div>
          </div>

          {mode === null ? (
            <div className="flex flex-1 flex-col gap-2 p-3">
              <button onClick={() => setMode("build")} className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50">
                <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={14} className="text-primary" />Build a visualization</div>
                <div className="mt-1 text-xs text-muted-foreground">Describe the chart you want in plain English.</div>
              </button>
              <button onClick={() => setMode("support")} className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50">
                <div className="flex items-center gap-2 text-sm font-semibold"><LifeBuoy size={14} className="text-emerald-600" />Contact support</div>
                <div className="mt-1 text-xs text-muted-foreground">Get help from our team.</div>
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    {mode === "build" ? "Try: “Show me spend by vendor for Q1.”" : "Describe your issue and we'll respond shortly."}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn("rounded-xl px-3 py-2 text-sm", m.role === "user" ? "ml-auto max-w-[80%] bg-primary text-primary-foreground" : "max-w-[80%] bg-muted")}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 p-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" className="h-9" onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button size="icon" className="h-9 w-9" onClick={send}><Send size={14} /></Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
