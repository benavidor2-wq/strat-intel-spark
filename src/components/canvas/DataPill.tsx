import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Pill {
  id: string;
  type: "dim" | "meas";
  agg?: "SUM" | "AVG" | "MIN" | "MAX" | "COUNT";
  granularity?: "Yearly" | "Quarterly" | "Weekly" | "Daily" | "Monthly";
}

interface Props {
  pill: Pill;
  onRemove?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  filterCount?: number;
  draggable?: boolean;
  compact?: boolean;
}

export function DataPill({ pill, onRemove, onClick, active, filterCount, draggable = true, compact }: Props) {
  const isDim = pill.type === "dim";
  const dot = isDim ? "bg-indigo-500" : "bg-emerald-500";
  const base = isDim
    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
    : "bg-emerald-50 text-emerald-700 border-emerald-100";

  const label = !isDim
    ? `${pill.agg || "SUM"}(${pill.id})`
    : pill.granularity
    ? `${pill.id} · ${pill.granularity}`
    : pill.id;

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/pill", JSON.stringify(pill));
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        "hover:shadow-sm active:scale-[0.98]",
        base,
        active && "ring-2 ring-primary/30",
        compact && "px-2 py-0.5 text-[11px]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="font-mono-data">{label}</span>
      {filterCount ? (
        <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold">{filterCount}</span>
      ) : null}
      {onRemove && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full p-0.5 opacity-60 hover:bg-black/10 hover:opacity-100"
        >
          <X size={11} />
        </span>
      )}
    </button>
  );
}
