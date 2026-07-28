// CLAUDE_NOTE (Projects tab)
// Purpose: Pick a project (from custom_fields: Job Site / Project / Job Code /
//   PO Number) and see every item purchased for it plus the grand total,
//   broken down by vendor and item.
// Data:    Derived client-side in useProjects / useProjectDetail from the
//   cached useReceipts() feed. No new Supabase calls.
// Owner:   Projects tab UI.
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useProjects, useProjectDetail } from "@/lib/dataSource";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function ProjectsTab() {
  const { projects, isLoading } = useProjects();
  const [selected, setSelected] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const detail = useProjectDetail(selected);

  const selectedLabel = useMemo(
    () => projects.find((p) => p.key === selected)?.value ?? null,
    [projects, selected],
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Project Overview</h1>
          <p className="text-sm text-muted-foreground">
            Pick a project to see every item purchased for it and the total spend.
          </p>
        </header>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FolderOpen size={18} className="text-muted-foreground" />
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[420px] justify-between"
                  disabled={isLoading}
                >
                  {selectedLabel ?? (isLoading ? "Loading projects…" : "Select a project…")}
                  <ChevronsUpDown size={14} className="ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search projects…" />
                  <CommandList>
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((p) => (
                        <CommandItem
                          key={p.key}
                          value={p.value}
                          onSelect={() => {
                            setSelected(p.key);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            size={14}
                            className={cn(
                              "mr-2",
                              selected === p.key ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-1 items-center justify-between">
                            <span className="truncate">{p.value}</span>
                            <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                              {p.receiptCount} inv · {fmt(p.totalSpend)}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selected && (
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Clear
              </Button>
            )}
          </div>
        </Card>

        {!selected && (
          <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center">
            <FolderOpen size={28} className="text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {projects.length === 0
                ? "No projects found yet. Projects come from a receipt's Job Site, Project, Job Code, or PO Number custom field."
                : "Select a project above to see its items and total."}
            </div>
          </Card>
        )}

        {selected && detail && detail.receipts.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No receipts matched this project.
          </Card>
        )}

        {selected && detail && detail.receipts.length > 0 && (
          <>
            <SummaryStrip label={selectedLabel ?? ""} detail={detail} />
            <VendorBarChart detail={detail} />
            <VendorBreakdown detail={detail} />
          </>
        )}
      </div>
    </div>
  );
}

function SummaryStrip({
  label,
  detail,
}: {
  label: string;
  detail: NonNullable<ReturnType<typeof useProjectDetail>>;
}) {
  const { start, end } = detail.dateRange;
  const range =
    start && end ? (start === end ? start : `${start} → ${end}`) : "—";
  const items = [
    { k: "Grand Total", v: fmt2(detail.grandTotal), highlight: true },
    { k: "Receipts", v: detail.receipts.length.toString() },
    { k: "Vendors", v: detail.totalsByVendor.length.toString() },
    { k: "Line items", v: detail.lineCount.toString() },
    { k: "Date range", v: range },
  ];
  return (
    <Card className="p-5">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {items.map((it) => (
          <div key={it.k}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {it.k}
            </div>
            <div
              className={cn(
                "mt-1 font-semibold tabular-nums",
                it.highlight ? "text-2xl text-primary" : "text-lg",
              )}
            >
              {it.v}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VendorBarChart({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof useProjectDetail>>;
}) {
  const data = detail.totalsByVendor.map((v) => ({ vendor: v.vendor, total: v.total }));
  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-semibold">Spend by vendor</div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="vendor" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v as number)} />
            <Tooltip formatter={(v) => fmt2(v as number)} />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function VendorBreakdown({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof useProjectDetail>>;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-semibold">Items by vendor</div>
      <div className="space-y-2">
        {detail.totalsByVendor.map((v) => (
          <VendorSection
            key={v.vendor}
            vendor={v.vendor}
            total={v.total}
            lineCount={v.lineCount}
            lines={detail.lineItems.filter((l) => l.vendor === v.vendor)}
          />
        ))}
      </div>
    </Card>
  );
}

function VendorSection({
  vendor, total, lineCount, lines,
}: {
  vendor: string;
  total: number;
  lineCount: number;
  lines: ReturnType<typeof useProjectDetail> extends infer T
    ? T extends { lineItems: infer L } ? L : never : never;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/40">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ChevronsUpDown size={14} className="text-muted-foreground" />
          {vendor}
          <span className="text-xs font-normal text-muted-foreground">
            · {lineCount} line{lineCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="text-sm font-semibold tabular-nums">{fmt2(total)}</div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-28 text-right">Unit price</TableHead>
              <TableHead className="w-28 text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={`${l.receiptId}-${i}`}>
                <TableCell className="text-xs text-muted-foreground">{l.date}</TableCell>
                <TableCell>{l.name}</TableCell>
                <TableCell className="text-right tabular-nums">{l.quantity || ""}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {l.unit_price ? fmt2(l.unit_price) : ""}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt2(l.total_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
