import { Users } from "lucide-react";
import { vendorConsolidation, summaryStats } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import DetailView from "./DetailView";

const purple = "#6366f1";
const danger = "#ef4444";
const warn = "#f59e0b";
const green = "#22c55e";

export default function VendorDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={Users} iconColor={purple} title="Vendor Bloat Index" onBack={onBack}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Vendor Count vs Industry Average</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorConsolidation} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip />
              <Bar dataKey="vendorCount" radius={[0, 6, 6, 0]} barSize={14} name="Your Vendors">
                {vendorConsolidation.map((entry, i) => (
                  <Cell key={i} fill={entry.redundancyScore > 70 ? danger : entry.redundancyScore > 50 ? warn : green} />
                ))}
              </Bar>
              <Bar dataKey="industryAvg" radius={[0, 6, 6, 0]} barSize={14} fill="#e5e7eb" name="Industry Avg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-4">
        {vendorConsolidation.map((v, i) => {
          const scoreColor = v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? warn : green;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{v.category}</h4>
                <span className="text-lg font-bold font-mono" style={{ color: green }}>${(v.potentialSavings / 1000).toFixed(0)}K</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Your Vendors</div>
                  <div className="font-mono font-semibold text-gray-700">{v.vendorCount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Industry Avg</div>
                  <div className="font-mono font-semibold text-gray-400">{v.industryAvg}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Redundancy</div>
                  <div className="font-mono font-semibold" style={{ color: scoreColor }}>{v.redundancyScore}%</div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
          <span className="text-sm text-gray-500">Your vendors: {summaryStats.activeVendors} vs Industry avg: {summaryStats.industryAvgVendors}</span>
          <span className="text-xl font-bold font-mono" style={{ color: purple }}>{summaryStats.vendorBloatScore}% bloat</span>
        </div>
      </div>
    </DetailView>
  );
}
