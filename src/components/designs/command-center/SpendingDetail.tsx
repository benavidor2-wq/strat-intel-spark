import { TrendingDown } from "lucide-react";
import { spendingTrends, summaryStats } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import DetailView from "./DetailView";

const purple = "#6366f1";
const danger = "#ef4444";
const green = "#22c55e";

export default function SpendingDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={TrendingDown} iconColor={purple} title="Margin Erosion Tracker" onBack={onBack}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue vs Costs Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingTrends}>
              <defs>
                <linearGradient id="det-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={purple} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={purple} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="det-cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={danger} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1e6}M`} />
              <Tooltip formatter={(v: number) => `$${(v / 1e6).toFixed(2)}M`} />
              <Area type="monotone" dataKey="revenue" stroke={purple} fill="url(#det-rev)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="costs" stroke={danger} fill="url(#det-cost)" strokeWidth={2} name="Costs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {spendingTrends.map((t) => (
          <div key={t.period} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{t.period}</div>
            <div className="text-lg font-bold" style={{ color: t.margin >= 28 ? green : t.margin >= 24 ? "#f59e0b" : danger }}>{t.margin}%</div>
            <div className="text-[10px] text-gray-400">margin</div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
        <span className="text-sm text-gray-500">Margin erosion over 5 quarters</span>
        <span className="text-xl font-bold font-mono" style={{ color: danger }}>{summaryStats.marginErosion}pp</span>
      </div>
    </DetailView>
  );
}
