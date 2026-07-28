import { useState } from "react";
import { DataPill, Pill } from "./DataPill";
import { DIMENSIONS, MEASURES, LINE_ITEM_DIMS, LINE_ITEM_MEASURES, CUSTOM_DIMS } from "@/lib/vizql";
import {
  BarChart3, BarChartBig, Rows3, LineChart, ScatterChart, PieChart, Table2, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHART_TYPES = [
  { id: "bar", label: "Bar", Icon: BarChart3 },
  { id: "grouped-bar", label: "Grouped", Icon: BarChartBig },
  { id: "stacked-bar", label: "Stacked", Icon: Rows3 },
  { id: "line", label: "Line", Icon: LineChart },
  { id: "scatter", label: "Scatter", Icon: ScatterChart },
  { id: "pie", label: "Pie", Icon: PieChart },
  { id: "table", label: "Table", Icon: Table2 },
];

function Section({ title, count, defaultOpen = true, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {title}
          {count != null && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{count}</span>}
        </span>
      </button>
      {open && <div className="mt-3 px-4">{children}</div>}
    </div>
  );
}

export function DataPane({
  chartType,
  setChartType,
  filters,
}: {
  chartType: string;
  setChartType: (t: string) => void;
  filters: Record<string, any>;
}) {
  const mkPill = (id: string, type: "dim" | "meas", agg?: any): Pill => ({ id, type, agg });
  const dims = [...DIMENSIONS, ...LINE_ITEM_DIMS, ...CUSTOM_DIMS];
  const meas = [...MEASURES, ...LINE_ITEM_MEASURES];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
      <Section title="Show Me" count={CHART_TYPES.length}>
        <div className="grid grid-cols-4 gap-1.5">
          {CHART_TYPES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              title={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] transition-colors",
                chartType === id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon size={16} />
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dimensions" count={dims.length}>
        <div className="flex flex-wrap gap-1.5">
          {dims.map((d) => (
            <DataPill key={d.id} pill={mkPill(d.id, "dim")} filterCount={filters[d.id]?.include?.length || filters[d.id]?.periods?.length || 0} />
          ))}
        </div>
      </Section>

      <Section title="Measures" count={meas.length}>
        <div className="flex flex-wrap gap-1.5">
          {meas.map((m) => (
            <DataPill key={m.id} pill={mkPill(m.id, "meas", m.agg)} />
          ))}
        </div>
      </Section>
    </aside>
  );
}
