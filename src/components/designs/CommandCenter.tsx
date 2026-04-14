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
import { AlertTriangle, Shield, TrendingDown, Zap, BarChart3, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const card = "bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-5";
const cyan = "#00e5ff";
const amber = "#ffab00";
const red = "#ff1744";

const SeverityDot = ({ severity }: { severity: string }) => (
  <span
    className="inline-block w-2 h-2 rounded-full mr-2"
    style={{ backgroundColor: severity === "critical" ? red : severity === "high" ? amber : cyan }}
  />
);

export default function CommandCenter() {
  return (
    <div className="min-h-screen" style={{ background: "#050d1a", color: "#c8d6e5" }}>
      {/* Header */}
      <div className="border-b border-[#1e3a5f] px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-wide" style={{ color: cyan, fontFamily: "'Inter', sans-serif" }}>
              STRATEGIC INTELLIGENCE ENGINE
            </h1>
            <p className="text-xs mt-1 opacity-60 tracking-widest uppercase">MyCFO — Autonomous Financial Oversight</p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-wider">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: red }}>{summaryStats.criticalAlerts}</div>
              <div className="opacity-50">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: amber }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</div>
              <div className="opacity-50">Lazy Tax</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: cyan }}>${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K</div>
              <div className="opacity-50">Savings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-3 gap-4">
        {/* Pillar 1: Integrity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: red }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: red }}>Integrity Layer</span>
          </div>
          <div className="space-y-3">
            {integrityAlerts.slice(0, 4).map((a) => (
              <div key={a.id} className="border-l-2 pl-3 py-1" style={{ borderColor: a.severity === "critical" ? red : amber }}>
                <div className="flex items-center text-xs">
                  <SeverityDot severity={a.severity} />
                  <span className="font-semibold" style={{ color: "#e8edf2" }}>{a.vendor}</span>
                  <span className="ml-auto font-mono" style={{ color: a.severity === "critical" ? red : amber }}>
                    ${a.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] opacity-50 mt-0.5">{a.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 2: Price Drift */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: amber }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: amber }}>Price Drift Monitor</span>
          </div>
          <div className="space-y-2">
            {priceDriftItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[120px]" style={{ color: "#e8edf2" }}>{item.product}</span>
                <div className="flex-1 mx-3 h-1 rounded-full bg-[#1e3a5f] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(item.driftPercent * 6, 100)}%`,
                      backgroundColor: item.status === "alert" ? red : item.status === "warning" ? amber : cyan,
                    }}
                  />
                </div>
                <span className="font-mono w-12 text-right" style={{ color: item.status === "alert" ? red : item.status === "warning" ? amber : cyan }}>
                  +{item.driftPercent}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 3: Arbitrage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: cyan }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: cyan }}>Cross-Vendor Arbitrage</span>
          </div>
          <div className="space-y-3">
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id} className="flex items-center gap-3 text-xs">
                <div className="flex-1 truncate" style={{ color: "#e8edf2" }}>{opp.product}</div>
                <div className="font-mono" style={{ color: amber }}>
                  ${opp.lazyTax.toFixed(1)}
                </div>
                <div className="font-mono text-[10px] opacity-50">
                  ${(opp.annualSavings / 1000).toFixed(0)}K/yr
                </div>
              </div>
            ))}
            <div className="border-t border-[#1e3a5f] pt-2 flex justify-between text-xs">
              <span className="opacity-50">Total Lazy Tax (Annual)</span>
              <span className="font-mono font-bold" style={{ color: cyan }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </motion.div>

        {/* Pillar 4: Inventory */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: "#69f0ae" }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#69f0ae" }}>Predictive Ordering</span>
          </div>
          <div className="space-y-3">
            {inventoryItems.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#e8edf2" }}>{item.product}</span>
                  <span className="font-mono" style={{ color: item.daysRemaining <= 7 ? red : item.daysRemaining <= 15 ? amber : "#69f0ae" }}>
                    {item.daysRemaining}d
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#1e3a5f] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                      backgroundColor: item.daysRemaining <= 7 ? red : item.daysRemaining <= 15 ? amber : "#69f0ae",
                    }}
                  />
                </div>
                <p className="text-[10px] opacity-40 mt-1">{item.suggestedAction}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 5: Spending Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: "#ff6e40" }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#ff6e40" }}>Margin Erosion Tracker</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="cc-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cyan} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={cyan} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cc-cost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={red} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: "#5a6e82" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#5a6e82" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1e6}M`} />
                <Area type="monotone" dataKey="revenue" stroke={cyan} fill="url(#cc-rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" stroke={red} fill="url(#cc-cost)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] mt-2 opacity-50">
            <span>Revenue vs Costs — Margin: {summaryStats.marginErosion}pp over 5Q</span>
          </div>
        </motion.div>

        {/* Pillar 6: Vendor Consolidation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: "#b388ff" }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#b388ff" }}>Vendor Bloat Index</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorConsolidation} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fill: "#5a6e82" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: "#5a6e82" }} axisLine={false} tickLine={false} width={80} />
                <Bar dataKey="vendorCount" radius={[0, 4, 4, 0]} barSize={10}>
                  {vendorConsolidation.map((entry, i) => (
                    <Cell key={i} fill={entry.redundancyScore > 70 ? red : entry.redundancyScore > 50 ? amber : cyan} />
                  ))}
                </Bar>
                <Bar dataKey="industryAvg" radius={[0, 4, 4, 0]} barSize={10} fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="opacity-50">Your vendors: {summaryStats.activeVendors}</span>
            <span className="opacity-50">Industry avg: {summaryStats.industryAvgVendors}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
