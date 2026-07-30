import { useState } from "react";
import { DataPill, Pill } from "./DataPill";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findFieldDef, uniqueValuesFor, measureRange, datePeriods } from "@/lib/vizql";
import { cn } from "@/lib/utils";

type Shelf = "rows" | "cols" | "filters";
export interface Shelves { rows: Pill[]; cols: Pill[]; filters: Pill[]; }

interface Props {
  shelves: Shelves;
  setShelves: (s: Shelves) => void;
  filters: Record<string, any>;
  setFilters: (f: Record<string, any>) => void;
  receipts: any[];
}

const LABELS: Record<Shelf, string> = { rows: "Rows", cols: "Columns", filters: "Filters" };

export function ShelfSystem({ shelves, setShelves, filters, setFilters, receipts }: Props) {
  const [dragOver, setDragOver] = useState<Shelf | null>(null);

  const drop = (shelf: Shelf) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData("application/pill");
    if (!raw) return;
    const pill: Pill = JSON.parse(raw);
    // remove from all shelves first
    const next: Shelves = {
      rows: shelves.rows.filter((p) => p.id !== pill.id),
      cols: shelves.cols.filter((p) => p.id !== pill.id),
      filters: shelves.filters.filter((p) => p.id !== pill.id),
    };
    next[shelf] = [...next[shelf], pill];
    setShelves(next);

    // New pills start with NO values selected. An explicit empty list is a real
    // constraint (vizql yields zero rows) until the user picks values or hits
    // "Select all". Measures keep their unconstrained range default.
    if (filters[pill.id] === undefined) {
      const def = findFieldDef(pill.id);
      if (def && def.type !== "meas") {
        setFilters({ ...filters, [pill.id]: def.isDate ? { periods: [] } : { include: [] } });
      }
    }
  };


  const removePill = (shelf: Shelf, id: string) => {
    setShelves({ ...shelves, [shelf]: shelves[shelf].filter((p) => p.id !== id) });
    const { [id]: _, ...rest } = filters;
    setFilters(rest);
  };

  return (
    <div className="grid grid-cols-3 gap-3 border-b border-border bg-card/50 px-4 py-3">
      {(["rows", "cols", "filters"] as Shelf[]).map((s) => (
        <div
          key={s}
          onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={drop(s)}
          className={cn(
            "min-h-[52px] rounded-xl border-2 p-2 transition-colors",
            shelves[s].length === 0
              ? "border-dashed border-border bg-background/40"
              : "border-solid border-border/70 bg-background",
            dragOver === s && "border-primary bg-primary/5",
          )}
        >
          <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {LABELS[s]}
          </div>
          {shelves[s].length === 0 ? (
            <div className="px-1 text-xs text-muted-foreground">Drop pills here</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shelves[s].map((pill) => (
                <FilterPopover
                  key={pill.id}
                  pill={pill}
                  filter={filters[pill.id]}
                  onChange={(f) => setFilters({ ...filters, [pill.id]: f })}
                  onRemove={() => removePill(s, pill.id)}
                  receipts={receipts}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FilterPopover({
  pill, filter, onChange, onRemove, receipts,
}: {
  pill: Pill;
  filter: any;
  onChange: (f: any) => void;
  onRemove: () => void;
  receipts: any[];
}) {
  const def = findFieldDef(pill.id);
  const isDim = pill.type === "dim";
  const isDate = def?.isDate;
  const filterCount = filter?.include?.length || filter?.periods?.length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>
          <DataPill pill={pill} onRemove={onRemove} filterCount={filterCount} draggable />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {isDate ? (
          <DateFilterUI pill={pill} filter={filter} onChange={onChange} receipts={receipts} />
        ) : isDim ? (
          <CategoricalFilterUI pill={pill} filter={filter} onChange={onChange} receipts={receipts} />
        ) : (
          <MeasureFilterUI pill={pill} filter={filter} onChange={onChange} receipts={receipts} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function CategoricalFilterUI({ pill, filter, onChange, receipts }: any) {
  const values = uniqueValuesFor(receipts, pill.id);
  const [q, setQ] = useState("");
  // `include` is authoritative: an empty array means nothing is selected.
  // Legacy pills without a filter object fall back to "everything selected".
  const include: string[] = Array.isArray(filter?.include) ? filter.include : values;
  const allSelected = values.length > 0 && include.length === values.length;
  const filtered = values.filter((v) => v.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Filter {pill.id}</div>
      <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8" />
      <div className="flex items-center justify-between gap-2 text-xs">
        <label className="flex items-center gap-2">
          <Checkbox checked={allSelected} onCheckedChange={(c) => onChange({ ...filter, include: c ? values : [] })} />
          <span>Select all</span>
        </label>
        <button
          type="button"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onChange({ ...filter, include: [] })}
        >
          Clear
        </button>
      </div>
      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded border border-border p-2">
        {filtered.map((v) => {
          const checked = include.includes(v);
          return (
            <label key={v} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => {
                  const next = c ? Array.from(new Set([...include, v])) : include.filter((x) => x !== v);
                  onChange({ ...filter, include: next });
                }}
              />
              <span className="truncate">{v}</span>
            </label>
          );
        })}
      </div>
      {include.length === 0 && (
        <div className="text-[11px] text-muted-foreground">
          No values selected — the view stays empty until you pick some or choose “Select all”.
        </div>
      )}
    </div>
  );
}


function MeasureFilterUI({ pill, filter, onChange, receipts }: any) {
  const { min, max } = measureRange(receipts, pill.id);
  const cur = filter?.range || [min, max];
  const agg = filter?.agg || pill.agg || "SUM";
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">Filter {pill.id}</div>
      <div>
        <div className="mb-1 text-xs">Aggregation</div>
        <Select value={agg} onValueChange={(v) => onChange({ ...filter, agg: v })}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["SUM", "AVG", "MIN", "MAX", "COUNT"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span>${cur[0]}</span><span>${cur[1]}</span>
        </div>
        <Slider min={min} max={max} step={1} value={cur} onValueChange={(v) => onChange({ ...filter, range: v, min: v[0], max: v[1] })} />
      </div>
    </div>
  );
}

function DateFilterUI({ pill, filter, onChange, receipts }: any) {
  const [gran, setGran] = useState<string>(pill.granularity || filter?.granularity || "Monthly");
  const periods = datePeriods(receipts, gran);
  const selected: string[] = Array.isArray(filter?.periods) ? filter.periods : periods;
  const allSelected = periods.length > 0 && selected.length === periods.length;
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">Filter Date</div>
      <div className="grid grid-cols-4 gap-1">
        {["Yearly", "Quarterly", "Monthly", "Weekly"].map((g) => (
          <Button key={g} size="sm" variant={gran === g ? "default" : "outline"} className="h-7 px-2 text-[11px]"
            onClick={() => { setGran(g); onChange({ ...filter, granularity: g, periods: [] }); }}>
            {g}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(c) => onChange({ ...filter, granularity: gran, periods: c ? periods : [] })}
          />
          <span>Select all</span>
        </label>
        <button
          type="button"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onChange({ ...filter, granularity: gran, periods: [] })}
        >
          Clear
        </button>
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-2 text-xs">
        {periods.map((p) => (
          <label key={p} className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(p)}
              onCheckedChange={(c) => {
                const next = c ? Array.from(new Set([...selected, p])) : selected.filter((x) => x !== p);
                onChange({ ...filter, granularity: gran, periods: next });
              }}
            />
            <span>{p}</span>
          </label>
        ))}
      </div>
      {selected.length === 0 && (
        <div className="text-[11px] text-muted-foreground">
          No periods selected — the view stays empty until you pick some or choose “Select all”.
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Custom range</div>
        <Calendar
          mode="range"
          selected={filter?.range}
          onSelect={(r: any) => onChange({ ...filter, range: r, granularity: gran })}
          className="rounded-md border p-0"
        />
      </div>
    </div>
  );
}
