import { useState } from "react";
import { ChartRenderer } from "./ChartRenderer";
import { computeContextualKPIs, fmtCurrency } from "@/lib/vizql";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DollarSign, Receipt, Users, TrendingUp } from "lucide-react";

const TINT: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  red: "bg-red-50 text-red-700 border-red-100",
};

const ICONS: Record<string, any> = {
  "Total Spend": DollarSign, "Total Tax": Receipt, "Vendors": Users, "Avg Invoice": TrendingUp,
  "Categories": Receipt, "MoM Change": TrendingUp,
};

interface Props {
  receipts: any[];
  chartType: string;
  chartData: any;
  dims: any[];
  meas: any[];
}

export function VizCanvas({ receipts, chartType, chartData, dims, meas }: Props) {
  const kpis = computeContextualKPIs(receipts, dims, meas);
  const [drill, setDrill] = useState<any>(null);

  return (
    <section className="flex-1 overflow-y-auto p-6">
      {kpis.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = ICONS[k.label] || DollarSign;
            return (
              <button
                key={k.label}
                onClick={() => setDrill(k)}
                className="glass-widget group rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className={cn("grid h-9 w-9 place-items-center rounded-xl border", TINT[k.tint] || TINT.indigo)}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="mt-1 font-mono-data text-3xl font-extrabold tracking-display">{k.value}</div>
                {k.sub && <div className="mt-0.5 text-xs text-muted-foreground">{k.sub}</div>}
                <div className="mt-2 h-0.5 w-8 origin-left scale-x-0 rounded-full bg-primary transition-transform group-hover:scale-x-100" />
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <ChartRenderer type={chartType} data={chartData.data || []} dims={chartData.dims || []} meas={chartData.meas || []} />
      </div>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{drill?.label}</DialogTitle></DialogHeader>
          <div className="font-mono-data text-4xl font-extrabold tracking-display">{drill?.value}</div>
          <div className="text-sm text-muted-foreground">{drill?.sub}</div>
          <div className="mt-4">
            <ChartRenderer
              type="bar"
              data={receipts.slice(0, 8).map((r) => ({ Vendor: r.merchant, Total: r.total }))}
              dims={[{ id: "Vendor" }]}
              meas={[{ id: "Total" }]}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
