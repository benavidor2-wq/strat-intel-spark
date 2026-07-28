import { useMemo, useState } from "react";
import { DataPane } from "./DataPane";
import { ShelfSystem, Shelves } from "./ShelfSystem";
import { VizCanvas } from "./VizCanvas";
import { buildChartData, suggestChartType } from "@/lib/vizql";
import { receipts as sampleReceipts } from "@/data/sampleData";

export function CanvasTab() {
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
    () => buildChartData(sampleReceipts, shelves.rows, shelves.cols, filters),
    [shelves, filters],
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
          receipts={sampleReceipts}
        />
        <VizCanvas
          receipts={sampleReceipts}
          chartType={effectiveType}
          chartData={chartData}
          dims={dims}
          meas={meas}
        />
      </div>
    </div>
  );
}
