import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, Line, Area, AreaChart, ScatterChart, Scatter, PieChart, Pie, Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { fmtCurrency } from "@/lib/vizql";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-widget rounded-lg px-3 py-2 text-xs">
      {label && <div className="mb-1 font-semibold text-foreground">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-mono-data font-semibold">{typeof p.value === "number" ? fmtCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="dot-grid flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
      <BarChart2 size={40} className="mb-3 opacity-40" />
      <div className="text-sm font-medium">Drop fields to build a chart</div>
      <div className="text-xs">Drag pills from the left onto Rows, Columns, or Filters.</div>
    </div>
  );
}

interface Props {
  type: string;
  data: any[];
  dims: { id: string }[];
  meas: { id: string }[];
}

const currencyTick = (v: number) => (typeof v === "number" ? fmtCurrency(v) : v);

export function ChartRenderer({ type, data, dims, meas }: Props) {
  if (!data.length || (!dims.length && !meas.length)) return <EmptyState />;
  const primaryDim = dims[0]?.id;
  const secondaryDim = dims[1]?.id;

  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
      <XAxis dataKey={primaryDim} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
      <Tooltip content={<GlassTooltip />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </>
  );

  const gradients = (
    <defs>
      {meas.map((m, i) => (
        <linearGradient key={m.id} id={`grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.95} />
          <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
        </linearGradient>
      ))}
    </defs>
  );

  if (type === "table") {
    const cols = [...dims.map((d) => d.id), ...meas.map((m) => m.id)];
    return (
      <div className="max-h-[500px] overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>{cols.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {cols.map((c) => (
                  <td key={c} className={`px-3 py-2 ${typeof row[c] === "number" ? "font-mono-data" : ""}`}>
                    {typeof row[c] === "number" ? fmtCurrency(row[c]) : row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "pie") {
    const m = meas[0]?.id;
    if (!m || !primaryDim) return <EmptyState />;
    return (
      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          <defs>
            <radialGradient id="pieGrad">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
            </radialGradient>
          </defs>
          <Pie data={data} dataKey={m} nameKey={primaryDim} innerRadius={70} outerRadius={140} paddingAngle={2}
            label={(e: any) => e[primaryDim]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter" && meas.length >= 2) {
    return (
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={meas[0].id} tickFormatter={currencyTick} tick={{ fontSize: 11 }} name={meas[0].id} />
          <YAxis dataKey={meas[1].id} tickFormatter={currencyTick} tick={{ fontSize: 11 }} name={meas[1].id} />
          <Tooltip content={<GlassTooltip />} />
          <Scatter data={data} fill="hsl(var(--chart-1))" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={data}>
          {gradients}
          {commonAxis}
          {meas.map((m, i) => (
            <Area key={m.id} type="monotone" dataKey={m.id} stroke={COLORS[i % COLORS.length]} strokeWidth={2}
              fill={`url(#grad-${m.id})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // bar variants
  const stackId = type === "stacked-bar" ? "s" : undefined;
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} barGap={4}>
        {gradients}
        {commonAxis}
        {meas.map((m, i) => (
          <Bar key={m.id} dataKey={m.id} fill={`url(#grad-${m.id})`} stackId={stackId} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
