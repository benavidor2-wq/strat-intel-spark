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
import { Shield, TrendingDown, Zap, BarChart3, Activity, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

const purple = "#6366f1";
const green = "#22c55e";
const warn = "#f59e0b";
const danger = "#ef4444";
const textPrimary = "#1e1b4b";
const textSecondary = "#6b7280";

const glass = "backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl p-6 shadow-lg shadow-indigo-500/5";

export default function Glassmorphism() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #eef2ff 100%)", color: textPrimary }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-light tracking-tight" style={{ color: textPrimary, fontFamily: "'Inter', sans-serif" }}>
            Strategic Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary }}>MyCFO Autonomous Oversight</p>

          {/* Summary Cards */}
          <div className="flex gap-4 mt-6">
            {[
              { label: "Critical Alerts", value: summaryStats.criticalAlerts, icon: Shield, color: danger },
              { label: "Inflation Leaks", value: summaryStats.inflationLeaks, icon: TrendingDown, color: warn },
              { label: "Lazy Tax / Year", value: `$${(summaryStats.totalLazyTax / 1000).toFixed(0)}K`, icon: Zap, color: purple },
              { label: "Total Savings", value: `$${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K`, icon: Activity, color: green },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`${glass} flex-1 flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-[1400px] mx-auto px-8 pb-12 grid grid-cols-2 gap-6">
          {/* Integrity */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className={glass}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              <Shield size={14} style={{ color: danger }} /> Integrity Layer
            </h3>
            <div className="space-y-3">
              {integrityAlerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium" style={{ color: textPrimary }}>{a.vendor}</span>
                    <span style={{ color: a.severity === "critical" ? danger : warn }}>${a.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: textSecondary }}>{a.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Price Drift */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className={glass}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              <TrendingDown size={14} style={{ color: purple }} /> Price Drift Monitor
            </h3>
            <div className="space-y-3">
              {priceDriftItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs w-28 truncate" style={{ color: textPrimary }}>{item.product}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.driftPercent * 6, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: item.status === "alert" ? `linear-gradient(90deg, ${danger}, #dc2626)` : item.status === "warning" ? `linear-gradient(90deg, ${warn}, #d97706)` : `linear-gradient(90deg, ${green}, #16a34a)` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-12 text-right font-semibold" style={{ color: item.status === "alert" ? danger : item.status === "warning" ? warn : green }}>
                    +{item.driftPercent}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arbitrage */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className={glass}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              <Zap size={14} style={{ color: purple }} /> Cross-Vendor Arbitrage
            </h3>
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id} className="mb-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                <div className="text-xs font-medium mb-2" style={{ color: textPrimary }}>{opp.product}</div>
                <div className="flex gap-1 mb-2">
                  {opp.vendors.map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg" style={{
                      background: v.price === opp.bestPrice ? `${green}15` : "rgba(0,0,0,0.03)",
                      border: v.price === opp.bestPrice ? `1px solid ${green}44` : "1px solid rgba(0,0,0,0.06)",
                      color: v.price === opp.bestPrice ? "#166534" : textSecondary,
                    }}>
                      {v.name}: ${v.price}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: textSecondary }}>
                  <span>Lazy Tax: <span style={{ color: danger }}>${opp.lazyTax}/unit</span></span>
                  <span style={{ color: green }}>${(opp.annualSavings / 1000).toFixed(0)}K/yr savings</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Spending Trends + Vendor Bloat */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className={glass}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Activity size={14} style={{ color: purple }} /> Margin Erosion
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingTrends}>
                    <defs>
                      <linearGradient id="gl-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={purple} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={purple} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" tick={{ fontSize: 9, fill: textSecondary }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1e6}M`} />
                    <Area type="monotone" dataKey="revenue" stroke={purple} fill="url(#gl-rev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="costs" stroke={danger} fill="none" strokeWidth={2} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className={glass}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Users size={14} style={{ color: purple }} /> Vendor Bloat
              </h3>
              <div className="flex gap-2">
                {vendorConsolidation.map((v, i) => (
                  <div key={i} className="flex-1 text-center p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <div className="text-lg font-semibold" style={{ color: v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? warn : green }}>{v.vendorCount}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: textSecondary }}>{v.category}</div>
                    <div className="text-[9px]" style={{ color: "#9ca3af" }}>avg: {v.industryAvg}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
