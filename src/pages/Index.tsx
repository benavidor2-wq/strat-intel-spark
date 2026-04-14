import { useState } from "react";
import CommandCenter from "@/components/designs/CommandCenter";
import Glassmorphism from "@/components/designs/Glassmorphism";

const designs = [
  { id: "command", label: "Command Center", description: "Dark ops — indigo & emerald on deep navy", component: CommandCenter },
  { id: "glass", label: "Glassmorphism", description: "Frosted translucent cards — indigo & emerald palette", component: Glassmorphism },
] as const;

export default function Index() {
  const [active, setActive] = useState(0);
  const safeIndex = active < designs.length ? active : 0;
  const ActiveComponent = designs[safeIndex].component;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-[100] flex items-center gap-1 px-4 py-2 overflow-x-auto"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }}>
        <span className="text-[10px] uppercase tracking-widest mr-3 shrink-0" style={{ color: "#9ca3af" }}>Design:</span>
        {designs.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className="text-xs px-3 py-1.5 rounded-full transition-all shrink-0"
            style={{
              background: active === i ? "#6366f1" : "transparent",
              color: active === i ? "#fff" : "#6b7280",
              fontWeight: active === i ? 600 : 400,
              border: active === i ? "none" : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {d.label}
          </button>
        ))}
        <span className="text-[10px] ml-4 shrink-0" style={{ color: "#555" }}>{designs[active].description}</span>
      </div>
      <div className="flex-1">
        <ActiveComponent />
      </div>
    </div>
  );
}
