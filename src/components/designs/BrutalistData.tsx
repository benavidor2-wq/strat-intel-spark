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

const black = "#000";
const white = "#fff";
const red = "#ff0000";
const yellow = "#ffe600";

export default function BrutalistData() {
  return (
    <div className="min-h-screen" style={{ background: white, color: black, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Hero header */}
      <div className="px-8 pt-12 pb-8" style={{ borderBottom: `4px solid ${black}` }}>
        <h1 className="text-7xl font-black uppercase tracking-tighter leading-none">
          MY<span style={{ color: red }}>CFO</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-[0.3em] mt-2" style={{ color: "#666" }}>Strategic Intelligence Engine</p>

        <div className="flex gap-0 mt-8">
          {[
            { value: summaryStats.criticalAlerts, label: "CRITICAL", bg: red, fg: white },
            { value: `$${(summaryStats.totalLazyTax / 1000).toFixed(0)}K`, label: "LAZY TAX", bg: yellow, fg: black },
            { value: `$${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K`, label: "SAVINGS", bg: black, fg: white },
            { value: `${summaryStats.marginErosion}pp`, label: "MARGIN EROSION", bg: red, fg: white },
            { value: `${summaryStats.activeVendors}`, label: "VENDORS", bg: yellow, fg: black },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="px-6 py-4" style={{ background: s.bg, color: s.fg, borderRight: i < 4 ? `2px solid ${white}` : "none" }}>
              <div className="text-4xl font-black">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Pillar 1 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}`, borderRight: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: red }}>01 — FORENSIC INTEGRITY</div>
          {integrityAlerts.map((a) => (
            <div key={a.id} className="mb-4 pb-4" style={{ borderBottom: `1px solid #ddd` }}>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black">{a.vendor}</span>
                <span className="text-2xl font-black" style={{ color: a.severity === "critical" ? red : "#000" }}>
                  ${a.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5"
                  style={{ background: a.severity === "critical" ? red : yellow, color: a.severity === "critical" ? white : black }}>
                  {a.severity}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5" style={{ background: "#eee" }}>
                  {a.type.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: "#666" }}>{a.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Pillar 2 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: "#cc8800" }}>02 — PRICE DRIFT</div>
          {priceDriftItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="text-sm font-bold">{item.product}</div>
                <div className="text-[10px] uppercase" style={{ color: "#999" }}>{item.vendor}</div>
              </div>
              <div className="text-4xl font-black" style={{ color: item.status === "alert" ? red : item.status === "warning" ? "#cc8800" : "#000" }}>
                +{item.driftPercent}%
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillar 3 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}`, borderRight: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: "#0066ff" }}>03 — ARBITRAGE OPPORTUNITIES</div>
          {arbitrageOpportunities.map((opp) => (
            <div key={opp.id} className="mb-5">
              <div className="text-sm font-bold mb-2">{opp.product}</div>
              <div className="flex items-end gap-1">
                {opp.vendors.map((v, i) => (
                  <div key={i} className="text-center" style={{ width: `${100 / opp.vendors.length}%` }}>
                    <div className="mx-1" style={{
                      height: `${(v.price / opp.currentPrice) * 60}px`,
                      background: v.price === opp.bestPrice ? black : "#ddd",
                    }} />
                    <div className="text-[9px] mt-1 font-bold">{v.name}</div>
                    <div className="text-[9px]">${v.price}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs mt-2 font-bold">
                <span style={{ color: red }}>Lazy Tax: ${opp.lazyTax}/unit</span>
                <span>${(opp.annualSavings / 1000).toFixed(0)}K/yr</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillar 4 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: "#00aa00" }}>04 — BURN RATE & ORDERING</div>
          {inventoryItems.map((item) => (
            <div key={item.id} className="mb-5">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold">{item.product}</span>
                <span className="text-3xl font-black" style={{ color: item.daysRemaining <= 7 ? red : item.daysRemaining <= 15 ? "#cc8800" : black }}>
                  {item.daysRemaining}d
                </span>
              </div>
              <div className="h-3 mt-2" style={{ background: "#eee" }}>
                <div className="h-full" style={{
                  width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                  background: item.daysRemaining <= 7 ? red : item.daysRemaining <= 15 ? yellow : black,
                }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: "#666" }}>
                Burn: {item.burnRate}/day | Stock: {item.currentStock} | {item.bulkDiscount > 0 ? `${item.bulkDiscount}% bulk discount` : "No discount"}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillar 5 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}`, borderRight: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: "#6600cc" }}>05 — COST vs REVENUE</div>
          {spendingTrends.map((s) => (
            <div key={s.period} className="mb-3">
              <div className="text-xs font-bold mb-1">{s.period}</div>
              <div className="flex gap-0 h-6">
                <div style={{ width: `${(s.revenue / 3500000) * 100}%`, background: black }} />
                <div style={{ width: `${(s.costs / 3500000) * 100}%`, background: red }} />
              </div>
              <div className="flex justify-between text-[10px] mt-0.5">
                <span>Rev: ${(s.revenue / 1e6).toFixed(1)}M</span>
                <span style={{ color: red }}>Cost: ${(s.costs / 1e6).toFixed(1)}M</span>
                <span className="font-bold">Margin: {s.margin}%</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillar 6 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="p-8" style={{ borderBottom: `2px solid ${black}` }}>
          <div className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: "#008888" }}>06 — VENDOR BLOAT</div>
          {vendorConsolidation.map((v) => (
            <div key={v.category} className="mb-4 flex items-center gap-4">
              <div className="text-5xl font-black leading-none" style={{
                color: v.redundancyScore > 70 ? red : v.redundancyScore > 50 ? "#cc8800" : black,
              }}>
                {v.vendorCount}
              </div>
              <div>
                <div className="text-sm font-bold">{v.category}</div>
                <div className="text-[10px]" style={{ color: "#666" }}>
                  Industry avg: {v.industryAvg} | Redundancy: {v.redundancyScore}% | Save ${(v.potentialSavings / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
