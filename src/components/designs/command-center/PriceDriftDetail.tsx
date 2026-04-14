import { TrendingDown } from "lucide-react";
import { priceDriftItems } from "@/data/mockData";
import DetailView from "./DetailView";

const purple = "#6366f1";
const danger = "#ef4444";
const warn = "#f59e0b";
const green = "#22c55e";

export default function PriceDriftDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={TrendingDown} iconColor={purple} title="Price Drift" onBack={onBack}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-wider text-gray-400">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3 text-right">Current</th>
              <th className="px-5 py-3 text-right">90-Day Avg</th>
              <th className="px-5 py-3 text-right">Drift</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {priceDriftItems.map((item) => {
              const statusColor = item.status === "alert" ? danger : item.status === "warning" ? warn : green;
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-900">{item.product}</td>
                  <td className="px-5 py-4 text-gray-500">{item.vendor}</td>
                  <td className="px-5 py-4 text-right font-mono">${item.currentPrice}</td>
                  <td className="px-5 py-4 text-right font-mono text-gray-400">${item.avg90Day}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold" style={{ color: statusColor }}>+{item.driftPercent}%</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${statusColor}15`, color: statusColor }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DetailView>
  );
}
