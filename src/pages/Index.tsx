import { useState } from "react";
import CommandCenter from "@/components/designs/CommandCenter";
import EditorialClean from "@/components/designs/EditorialClean";
import Glassmorphism from "@/components/designs/Glassmorphism";
import RetroTerminal from "@/components/designs/RetroTerminal";
import BrutalistData from "@/components/designs/BrutalistData";
import NeoArtDeco from "@/components/designs/NeoArtDeco";

const designs = [
  { id: "command", label: "Command Center", description: "Dark military ops — neon cyan/amber on deep navy", component: CommandCenter },
  { id: "editorial", label: "Editorial", description: "Light Swiss-style with elegant typography", component: EditorialClean },
  { id: "glass", label: "Glassmorphism", description: "Frosted translucent cards over gradient backgrounds", component: Glassmorphism },
  { id: "terminal", label: "Retro Terminal", description: "Green phosphor CRT with scanlines", component: RetroTerminal },
  { id: "brutalist", label: "Brutalist", description: "Raw oversized numbers, high contrast", component: BrutalistData },
  { id: "deco", label: "Neo Art Deco", description: "Gold and navy with geometric accents", component: NeoArtDeco },
] as const;

export default function Index() {
  const [active, setActive] = useState(0);
  const ActiveComponent = designs[active].component;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Design Switcher Nav */}
      <div className="sticky top-0 z-[100] flex items-center gap-1 px-4 py-2 overflow-x-auto"
        style={{ background: "rgba(0,0,0,0.95)", borderBottom: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <span className="text-[10px] uppercase tracking-widest mr-3 shrink-0" style={{ color: "#666" }}>Design:</span>
        {designs.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className="text-xs px-3 py-1.5 rounded-full transition-all shrink-0"
            style={{
              background: active === i ? "#fff" : "transparent",
              color: active === i ? "#000" : "#888",
              fontWeight: active === i ? 600 : 400,
              border: active === i ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {d.label}
          </button>
        ))}
        <span className="text-[10px] ml-4 shrink-0" style={{ color: "#555" }}>{designs[active].description}</span>
      </div>

      {/* Active Design */}
      <div className="flex-1">
        <ActiveComponent />
      </div>
    </div>
  );
}
