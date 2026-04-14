import { Zap } from "lucide-react";
import { arbitrageOpportunities, summaryStats } from "@/data/mockData";
import DetailView from "./DetailView";

const green = "#22c55e";
const danger = "#ef4444";
const purple = "#6366f1";

export default function ArbitrageDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={Zap} iconColor={green} title="Arbitrage & Best Price" onBack={onBack}>
      <div className="grid gap-4">
        {arbitrageOpportunities.map((opp) => (
          <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{opp.product}</h3>
              <div className="text-right">
                <div className="text-lg font-bold font-mono" style={{ color: green }}>${(opp.annualSavings / 1000).toFixed(0)}K/yr</div>
                <div className="text-[10px] text-gray-400">potential savings</div>
              </div>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {opp.vendors.map((v, i) => (
                <div key={i} className="px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: v.price === opp.bestPrice ? `${green}10` : "#f9fafb",
                    border: v.price === opp.bestPrice ? `2px solid ${green}` : "1px solid #e5e7eb",
                  }}>
                  <div className="font-medium text-gray-700">{v.name}</div>
                  <div className="font-mono font-semibold mt-0.5" style={{ color: v.price === opp.bestPrice ? green : "#374151" }}>
                    ${v.price}
                  </div>
                  {v.price === opp.bestPrice && (
                    <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: green }}>Best Price</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Current: <span className="font-mono text-gray-700">${opp.currentPrice}</span></span>
              <span>Lazy Tax: <span className="font-mono font-semibold" style={{ color: danger }}>${opp.lazyTax}/unit</span></span>
            </div>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
          <span className="text-sm text-gray-500">Total Annual Lazy Tax</span>
          <span className="text-xl font-bold font-mono" style={{ color: purple }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</span>
        </div>
      </div>
    </DetailView>
  );
}
