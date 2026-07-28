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
