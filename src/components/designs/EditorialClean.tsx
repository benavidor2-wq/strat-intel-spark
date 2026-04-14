import { motion } from "framer-motion";
import {
  integrityAlerts,
  priceDriftItems,
  arbitrageOpportunities,
  inventoryItems,
  spendingTrends,
  vendorConsolidation,
  summaryStats,
} from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function EditorialClean() {
  return (
    <div className="min-h-screen" style={{ background: "#fafafa", color: "#1a1a1a", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-8 pt-16 pb-8 border-b" style={{ borderColor: "#e0e0e0" }}>
        <h1 className="text-4xl font-normal tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
          Strategic Intelligence
        </h1>
        <p className="text-sm mt-2" style={{ color: "#888", fontFamily: "'Inter', sans-serif" }}>
          Autonomous financial oversight across 6 intelligence pillars
        </p>
        <div className="flex gap-12 mt-8">
          {[
            { label: "Critical Anomalies", value: summaryStats.criticalAlerts, color: "#d32f2f" },
            { label: "Annual Lazy Tax", value: `$${(summaryStats.totalLazyTax / 1000).toFixed(0)}K`, color: "#1a1a1a" },
            { label: "Total Savings Potential", value: `$${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K`, color: "#2e7d32" },
            { label: "Margin Erosion", value: `${summaryStats.marginErosion}pp`, color: "#d32f2f" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-light" style={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider mt-1" style={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-16">
        {/* Pillar 1 */}
        <motion.section {...fadeIn} transition={{ delay: 0.1 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#d32f2f", fontFamily: "'Inter', sans-serif" }}>01</span>
            <h2 className="text-2xl font-normal">Forensic Integrity</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {integrityAlerts.map((a) => (
              <div key={a.id} className="border-l-2 pl-4 py-2" style={{ borderColor: a.severity === "critical" ? "#d32f2f" : "#f57c00" }}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{a.vendor}</span>
                  <span className="text-sm font-light" style={{ color: "#888" }}>${a.amount.toLocaleString()}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#777" }}>{a.description}</p>
                <span className="inline-block text-[10px] uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full"
                  style={{ background: a.severity === "critical" ? "#ffebee" : "#fff3e0", color: a.severity === "critical" ? "#d32f2f" : "#f57c00" }}>
                  {a.type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pillar 2 */}
        <motion.section {...fadeIn} transition={{ delay: 0.2 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#f57c00", fontFamily: "'Inter', sans-serif" }}>02</span>
            <h2 className="text-2xl font-normal">Price Drift Analysis</h2>
          </div>
          <table className="w-full text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: "#999" }}>
                <th className="text-left font-normal pb-3">Product</th>
                <th className="text-left font-normal pb-3">Vendor</th>
                <th className="text-right font-normal pb-3">Current</th>
                <th className="text-right font-normal pb-3">90-Day Avg</th>
                <th className="text-right font-normal pb-3">Drift</th>
              </tr>
            </thead>
            <tbody>
              {priceDriftItems.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: "#eee" }}>
                  <td className="py-3 font-medium">{item.product}</td>
                  <td className="py-3" style={{ color: "#888" }}>{item.vendor}</td>
                  <td className="py-3 text-right font-light">${item.currentPrice}</td>
                  <td className="py-3 text-right font-light" style={{ color: "#888" }}>${item.avg90Day}</td>
                  <td className="py-3 text-right font-semibold" style={{ color: item.status === "alert" ? "#d32f2f" : item.status === "warning" ? "#f57c00" : "#2e7d32" }}>
                    +{item.driftPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>

        {/* Pillar 3 */}
        <motion.section {...fadeIn} transition={{ delay: 0.3 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#1565c0", fontFamily: "'Inter', sans-serif" }}>03</span>
            <h2 className="text-2xl font-normal">Cross-Vendor Arbitrage</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id} className="p-5 rounded-lg" style={{ background: "#f5f5f5" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{opp.product}</h3>
                <div className="flex gap-2 mb-3">
                  {opp.vendors.map((v, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded" style={{
                      background: v.price === opp.bestPrice ? "#e8f5e9" : "#fff",
                      border: "1px solid",
                      borderColor: v.price === opp.bestPrice ? "#a5d6a7" : "#e0e0e0",
                    }}>
                      {v.name}: ${v.price}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-xs" style={{ color: "#888" }}>
                  <span>Lazy Tax: <strong style={{ color: "#d32f2f" }}>${opp.lazyTax.toFixed(2)}/unit</strong></span>
                  <span>Annual: <strong style={{ color: "#2e7d32" }}>${(opp.annualSavings / 1000).toFixed(0)}K</strong></span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pillar 4 */}
        <motion.section {...fadeIn} transition={{ delay: 0.4 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#2e7d32", fontFamily: "'Inter', sans-serif" }}>04</span>
            <h2 className="text-2xl font-normal">Predictive Ordering</h2>
          </div>
          <div className="space-y-4">
            {inventoryItems.map((item) => (
              <div key={item.id} className="flex items-center gap-6 py-3 border-b" style={{ borderColor: "#eee" }}>
                <div className="w-32 text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{item.product}</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e0e0e0" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                      background: item.daysRemaining <= 7 ? "#d32f2f" : item.daysRemaining <= 15 ? "#f57c00" : "#2e7d32",
                    }} />
                  </div>
                </div>
                <div className="text-sm font-light w-16 text-right">{item.daysRemaining} days</div>
                <div className="text-xs w-64" style={{ color: "#888" }}>{item.suggestedAction}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pillar 5 */}
        <motion.section {...fadeIn} transition={{ delay: 0.5 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#6a1b9a", fontFamily: "'Inter', sans-serif" }}>05</span>
            <h2 className="text-2xl font-normal">Spending & Margin Trends</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="ed-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1565c0" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#1565c0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ed-cost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d32f2f" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#d32f2f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1e6}M`} />
                <Area type="monotone" dataKey="revenue" stroke="#1565c0" fill="url(#ed-rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" stroke="#d32f2f" fill="url(#ed-cost)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Pillar 6 */}
        <motion.section {...fadeIn} transition={{ delay: 0.6 }}>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#00838f", fontFamily: "'Inter', sans-serif" }}>06</span>
            <h2 className="text-2xl font-normal">Vendor Consolidation</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {vendorConsolidation.map((v, i) => (
              <div key={i} className="text-center p-4 rounded-lg" style={{ background: "#f5f5f5" }}>
                <div className="text-3xl font-light" style={{ color: v.redundancyScore > 70 ? "#d32f2f" : v.redundancyScore > 50 ? "#f57c00" : "#2e7d32" }}>
                  {v.vendorCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "#999" }}>vendors</div>
                <div className="text-xs font-medium mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>{v.category}</div>
                <div className="text-[10px] mt-1" style={{ color: "#999" }}>Industry: {v.industryAvg}</div>
                <div className="text-xs mt-2 font-semibold" style={{ color: "#2e7d32" }}>${(v.potentialSavings / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
