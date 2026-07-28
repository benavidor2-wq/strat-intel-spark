import { useMemo, useState } from "react";
import { Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPane } from "./DataPane";
import { ShelfSystem, Shelves } from "./ShelfSystem";
import { VizCanvas } from "./VizCanvas";
import { buildChartData, suggestChartType } from "@/lib/vizql";
import { UploadDialog } from "@/components/uploads/UploadDialog";
// CLAUDE_NOTE (data source)
// Canvas is a BI shelf-and-chart builder driven entirely by receipts from
// `useReceipts()` (view `receipts_full`). When the feed is empty, the pane
// swaps to an ingestion CTA instead of rendering empty shelves.
import { useReceipts, useHasAnyData } from "@/lib/dataSource";

export function CanvasTab() {
  const { data: receipts = [] } = useReceipts();
  const hasData = useHasAnyData();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shelves, setShelves] = useState<Shelves>({
    rows: [{ id: "Vendor", type: "dim" }],
    cols: [{ id: "Total", type: "meas", agg: "SUM" }],
    filters: [],
  });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [chartType, setChartType] = useState<string>("bar");
  const [manualType, setManualType] = useState(false);

  const suggested = useMemo(() => suggestChartType(shelves.rows, shelves.cols), [shelves]);
  const effectiveType = manualType ? chartType : suggested;

  const chartData = useMemo(
    () => buildChartData(receipts, shelves.rows, shelves.cols, filters),
    [receipts, shelves, filters],
  );

  const dims = [...shelves.rows, ...shelves.cols].filter((p) => p.type === "dim");
  const meas = [...shelves.rows, ...shelves.cols].filter((p) => p.type === "meas");

  // CLAUDE_NOTE (empty state)
  // Purpose: the Canvas is meaningless without receipts. Show a single
  //   ingestion CTA until at least one receipt lands, instead of rendering
  //   empty shelves and axis stubs.
  // Data contract: `useHasAnyData()` → `dataset_stats().receipt_count > 0`.
  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-8">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <UploadIcon size={22} />
          </div>
          <h2 className="mb-2 text-lg font-bold">No invoices ingested yet</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            The Canvas builds charts from your ingested invoices. Drop a PDF,
            image, Word doc, or spreadsheet and the shelves will light up as
            soon as parsing finishes.
          </p>
          <Button onClick={() => setUploadOpen(true)}>
            <UploadIcon size={14} className="mr-1.5" /> Upload invoices
          </Button>
        </div>
        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <DataPane
        chartType={effectiveType}
        setChartType={(t) => { setChartType(t); setManualType(true); }}
        filters={filters}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ShelfSystem
          shelves={shelves}
          setShelves={(s) => { setShelves(s); setManualType(false); }}
          filters={filters}
          setFilters={setFilters}
          receipts={receipts}
        />
        <VizCanvas
          receipts={receipts}
          chartType={effectiveType}
          chartData={chartData}
          dims={dims}
          meas={meas}
        />
      </div>
    </div>
  );
}
