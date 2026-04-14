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

const card = "bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg p-5";
const purple = "#6366f1";
const green = "#22c55e";
const warn = "#f59e0b";
const danger = "#ef4444";

const SeverityDot = ({ severity }: { severity: string }) => (
  <span
    className="inline-block w-2 h-2 rounded-full mr-2"
    style={{ backgroundColor: severity === "critical" ? danger : severity === "high" ? warn : purple }}
  />
);

export default function CommandCenter() {
  return (
    <div className="min-h-screen" style={{ background: "#050510", color: "#c8cde5" }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ borderColor: "#1e1e3a" }}>
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-wide" style={{ color: purple, fontFamily: "'Inter', sans-serif" }}>
              STRATEGIC INTELLIGENCE ENGINE
            </h1>
            <p className="text-xs mt-1 opacity-60 tracking-widest uppercase">MyCFO — Autonomous Financial Oversight</p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-wider">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: danger }}>{summaryStats.criticalAlerts}</div>
              <div className="opacity-50">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: warn }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</div>
              <div className="opacity-50">Lazy Tax</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: green }}>${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K</div>
              <div className="opacity-50">Savings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-3 gap-4">
        {/* Pillar 1: Integrity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: danger }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: danger }}>Integrity Layer</span>
          </div>
          <div className="space-y-3">
            {integrityAlerts.slice(0, 4).map((a) => (
              <div key={a.id} className="border-l-2 pl-3 py-1" style={{ borderColor: a.severity === "critical" ? danger : warn }}>
                <div className="flex items-center text-xs">
                  <SeverityDot severity={a.severity} />
                  <span className="font-semibold" style={{ color: "#e8edf2" }}>{a.vendor}</span>
                  <span className="ml-auto font-mono" style={{ color: a.severity === "critical" ? danger : warn }}>
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
            <TrendingDown size={16} style={{ color: purple }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: purple }}>Price Drift Monitor</span>
          </div>
          <div className="space-y-2">
            {priceDriftItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[120px]" style={{ color: "#e8edf2" }}>{item.product}</span>
                <div className="flex-1 mx-3 h-1 rounded-full bg-[#1e1e3a] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(item.driftPercent * 6, 100)}%`,
                      backgroundColor: item.status === "alert" ? danger : item.status === "warning" ? warn : green,
                    }}
                  />
                </div>
                <span className="font-mono w-12 text-right" style={{ color: item.status === "alert" ? danger : item.status === "warning" ? warn : green }}>
                  +{item.driftPercent}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 3: Arbitrage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: green }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: green }}>Cross-Vendor Arbitrage</span>
          </div>
          <div className="space-y-3">
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id} className="flex items-center gap-3 text-xs">
                <div className="flex-1 truncate" style={{ color: "#e8edf2" }}>{opp.product}</div>
                <div className="font-mono" style={{ color: warn }}>
                  ${opp.lazyTax.toFixed(1)}
                </div>
                <div className="font-mono text-[10px] opacity-50">
                  ${(opp.annualSavings / 1000).toFixed(0)}K/yr
                </div>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between text-xs" style={{ borderColor: "#1e1e3a" }}>
              <span className="opacity-50">Total Lazy Tax (Annual)</span>
              <span className="font-mono font-bold" style={{ color: green }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </motion.div>

        {/* Pillar 4: Inventory */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: green }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: green }}>Predictive Ordering</span>
          </div>
          <div className="space-y-3">
            {inventoryItems.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#e8edf2" }}>{item.product}</span>
                  <span className="font-mono" style={{ color: item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green }}>
                    {item.daysRemaining}d
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#1e1e3a] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                      backgroundColor: item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green,
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
            <TrendingDown size={16} style={{ color: purple }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: purple }}>Margin Erosion Tracker</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="cc-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={purple} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={purple} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cc-cost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={danger} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: "#5a5e82" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#5a5e82" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1e6}M`} />
                <Area type="monotone" dataKey="revenue" stroke={purple} fill="url(#cc-rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" stroke={danger} fill="url(#cc-cost)" strokeWidth={2} />
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
            <Users size={16} style={{ color: purple }} />
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: purple }}>Vendor Bloat Index</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorConsolidation} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fill: "#5a5e82" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: "#5a5e82" }} axisLine={false} tickLine={false} width={80} />
                <Bar dataKey="vendorCount" radius={[0, 4, 4, 0]} barSize={10}>
                  {vendorConsolidation.map((entry, i) => (
                    <Cell key={i} fill={entry.redundancyScore > 70 ? danger : entry.redundancyScore > 50 ? warn : green} />
                  ))}
                </Bar>
                <Bar dataKey="industryAvg" radius={[0, 4, 4, 0]} barSize={10} fill="#1e1e3a" />
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
