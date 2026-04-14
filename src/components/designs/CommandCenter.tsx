import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  integrityAlerts,
  priceDriftItems,
  arbitrageOpportunities,
  inventoryItems,
  spendingTrends,
  vendorConsolidation,
  summaryStats,
} from "@/data/mockData";
import { Shield, TrendingDown, Zap, BarChart3, Users, Gift } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import IntegrityDetail from "./command-center/IntegrityDetail";
import PriceDriftDetail from "./command-center/PriceDriftDetail";
import ArbitrageDetail from "./command-center/ArbitrageDetail";
import InventoryDetail from "./command-center/InventoryDetail";
import SpendingDetail from "./command-center/SpendingDetail";
import VendorDetail from "./command-center/VendorDetail";

const purple = "#6366f1";
const green = "#22c55e";
const warn = "#f59e0b";
const danger = "#ef4444";

type Pillar = null | "integrity" | "priceDrift" | "arbitrage" | "inventory" | "spending" | "vendor";

/* ── Semi-circular gauge SVG ── */
function OpportunityGauge({ current, optimal }: { current: number; optimal: number }) {
  const pct = Math.min(optimal / current, 1);
  const r = 38;
  const circumHalf = Math.PI * r;
  const offset = circumHalf * (1 - pct);
  return (
    <svg viewBox="0 0 100 58" className="w-full max-w-[100px] mx-auto">
      <path d={`M 10 54 A ${r} ${r} 0 0 1 90 54`} fill="none" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
      <path d={`M 10 54 A ${r} ${r} 0 0 1 90 54`} fill="none" stroke={green} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circumHalf} strokeDashoffset={offset} />
      <text x="50" y="48" textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151">
        {Math.round(pct * 100)}%
      </text>
      <text x="50" y="56" textAnchor="middle" fontSize="5" fill="#9ca3af">optimal</text>
    </svg>
  );
}

export default function CommandCenter() {
  const [activePillar, setActivePillar] = useState<Pillar>(null);
  const goBack = () => setActivePillar(null);

  const criticalCount = integrityAlerts.filter((a) => a.severity === "critical").length;
  const highCount = integrityAlerts.filter((a) => a.severity === "high").length;

  // Arbitrage calcs
  const totalCurrentSpend = arbitrageOpportunities.reduce((s, o) => s + o.currentPrice * 480, 0); // approximate annual units
  const totalOptimalSpend = arbitrageOpportunities.reduce((s, o) => s + o.bestPrice * 480, 0);
  const top3Savings = [...arbitrageOpportunities].sort((a, b) => b.annualSavings - a.annualSavings).slice(0, 3);
  const totalAnnualSavings = arbitrageOpportunities.reduce((s, o) => s + o.annualSavings, 0);

  // Spending margin
  const latestMargin = spendingTrends[spendingTrends.length - 1].margin;
  const prevMargin = spendingTrends[spendingTrends.length - 2].margin;
  const marginTrend = latestMargin - prevMargin;

  // Vendor consolidation total savings
  const totalConsolidationSavings = vendorConsolidation.reduce((s, v) => s + v.potentialSavings, 0);

  return (
    <AnimatePresence mode="wait">
      {activePillar === "integrity" ? (
        <IntegrityDetail key="integrity" onBack={goBack} />
      ) : activePillar === "priceDrift" ? (
        <PriceDriftDetail key="priceDrift" onBack={goBack} />
      ) : activePillar === "arbitrage" ? (
        <ArbitrageDetail key="arbitrage" onBack={goBack} />
      ) : activePillar === "inventory" ? (
        <InventoryDetail key="inventory" onBack={goBack} />
      ) : activePillar === "spending" ? (
        <SpendingDetail key="spending" onBack={goBack} />
      ) : activePillar === "vendor" ? (
        <VendorDetail key="vendor" onBack={goBack} />
      ) : (
        <motion.div
          key="overview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -40 }}
          className="h-full flex flex-col overflow-hidden"
          style={{ background: "#f8f9fc", color: "#1e1b4b" }}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-2 bg-white">
            <div className="flex items-center justify-between max-w-[1600px] mx-auto">
              <div>
                <h1 className="text-xl font-bold tracking-wide" style={{ color: purple }}>
                  STRATEGIC INTELLIGENCE ENGINE
                </h1>
                <p className="text-xs mt-1 tracking-widest uppercase text-gray-500">
                  MyCFO — Autonomous Financial Oversight
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards Grid */}
          <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-6 pt-3 pb-2 grid grid-cols-3 auto-rows-fr gap-3 overflow-hidden">

            {/* ═══ 1. ARBITRAGE & BEST PRICE ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative"
              onClick={() => setActivePillar("arbitrage")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: green }}>4</div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={15} style={{ color: green }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: green }}>Arbitrage & Best Price</span>
              </div>
              {/* Gauge centered on top */}
              <div className="flex justify-center mb-2">
                <div className="flex flex-col items-center">
                  <OpportunityGauge current={totalCurrentSpend} optimal={totalOptimalSpend} />
                  <span className="text-[8px] text-gray-400 mt-0.5">Current vs Optimal</span>
                </div>
              </div>
              {/* Line items below */}
              <div className="flex-1 flex flex-col justify-evenly">
                {top3Savings.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded-lg bg-gray-50">
                    <span className="text-gray-700 truncate max-w-[120px]">{opp.product}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-gray-400 line-through text-[9px]">${opp.currentPrice}</span>
                      <span className="font-mono font-bold" style={{ color: green }}>${opp.bestPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: green }}>
                  ${(totalAnnualSavings / 1000).toFixed(0)}K/yr savings
                </div>
                <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* ═══ 2. PRICE DRIFT ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative"
              onClick={() => setActivePillar("priceDrift")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: warn }}>3</div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={15} style={{ color: purple }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Price Drift</span>
              </div>
              <div className="flex-1 flex flex-col justify-evenly">
                {priceDriftItems.slice(0, 5).map((item) => {
                  const isWarning = item.driftPercent > 5;
                  const barColor = item.status === "alert" ? danger : item.status === "warning" ? warn : green;
                  const barHeight = Math.max(3, Math.min(item.driftPercent * 0.8, 8));
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-600 truncate w-[75px]">{item.product}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(item.driftPercent * 6, 100)}%` }}
                          transition={{ delay: 0.4, duration: 0.6 }}
                          style={{ backgroundColor: barColor, height: barHeight }}
                        />
                      </div>
                      <span
                        className="font-mono font-bold w-12 text-right text-[10px] px-1 py-0.5 rounded"
                        style={{
                          color: isWarning ? "white" : barColor,
                          backgroundColor: isWarning ? barColor : "transparent",
                        }}
                      >
                        +{item.driftPercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>{priceDriftItems.filter(p => p.driftPercent > 5).length} items &gt;5% drift</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* ═══ 3. PREDICTIVE ORDERING ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative"
              onClick={() => setActivePillar("inventory")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: danger }}>2</div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={15} style={{ color: green }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: green }}>Predictive Ordering</span>
              </div>
              <div className="flex-1 flex flex-col justify-evenly">
                {inventoryItems.slice(0, 5).map((item) => {
                  const urgColor = item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green;
                  return (
                    <div key={item.id}>
                      <div className="flex justify-between items-center text-[10px] mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600">{item.product}</span>
                          {item.bulkDiscount > 0 && (
                            <Gift size={10} style={{ color: green }} className="shrink-0" />
                          )}
                        </div>
                        <span className="font-mono font-bold" style={{ color: urgColor }}>{item.daysRemaining}d</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%` }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          style={{ backgroundColor: urgColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span><Gift size={9} className="inline" style={{ color: green }} /> = bulk discount</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* ═══ 4. SPENDING PATTERNS & TRENDS ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative"
              onClick={() => setActivePillar("spending")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: purple }}>1</div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={15} style={{ color: purple }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Spending Patterns</span>
              </div>
              {/* Chart on top */}
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingTrends}>
                    <defs>
                      <linearGradient id="cc-mini-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={purple} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={purple} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" tick={{ fontSize: 8, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Area type="monotone" dataKey="revenue" stroke={purple} fill="url(#cc-mini-rev)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="costs" stroke={danger} fill="none" strokeWidth={1.5} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Margin below */}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Margin</span>
                  <motion.span
                    className="text-sm font-bold font-mono px-2 py-0.5 rounded-md"
                    style={{
                      color: marginTrend >= 0 ? green : danger,
                      backgroundColor: marginTrend >= 0 ? `${green}15` : `${danger}15`,
                    }}
                    animate={marginTrend < 0 ? { opacity: [1, 0.6, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {latestMargin}%
                  </motion.span>
                  <span className="text-[9px] font-mono" style={{ color: marginTrend >= 0 ? green : danger }}>
                    {marginTrend >= 0 ? "+" : ""}{marginTrend}pp
                  </span>
                </div>
                <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* ═══ 5. VENDOR CONSOLIDATION ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative"
              onClick={() => setActivePillar("vendor")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: warn }}>3</div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={15} style={{ color: purple }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Vendor Consolidation</span>
              </div>
              <div className="flex-1 flex flex-col justify-evenly">
                {vendorConsolidation.map((v, i) => {
                  const scoreColor = v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? warn : green;
                  const maxCount = 16;
                  return (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-600 truncate w-[70px]">{v.category}</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full absolute left-0 top-0"
                          initial={{ width: 0 }}
                          animate={{ width: `${(v.vendorCount / maxCount) * 100}%` }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          style={{ backgroundColor: scoreColor }}
                        />
                        <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: `${(v.industryAvg / maxCount) * 100}%` }} />
                      </div>
                      <span className="font-mono font-bold w-5 text-right" style={{ color: scoreColor }}>{v.vendorCount}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Avg savings: <span className="font-mono font-semibold" style={{ color: green }}>${(totalConsolidationSavings / 1000).toFixed(0)}K</span></span>
                <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* ═══ 6. ANOMALY & RISK MITIGATION ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between relative overflow-hidden"
              onClick={() => setActivePillar("integrity")}>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: danger }}>2</div>
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: `2px solid ${purple}` }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <div className="flex items-center gap-2 mb-2">
                <Shield size={15} style={{ color: danger }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: danger }}>Anomaly & Risk</span>
              </div>
              {/* Severity Counters */}
              <div className="flex gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: `${danger}12` }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: danger }} />
                  <span className="text-[10px] font-bold" style={{ color: danger }}>{criticalCount} Critical</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: `${warn}12` }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: warn }} />
                  <span className="text-[10px] font-bold" style={{ color: warn }}>{highCount} High</span>
                </div>
              </div>
              {/* Flagged entities */}
              <div className="flex-1 flex flex-col justify-evenly">
                {integrityAlerts.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: a.severity === "critical" ? danger : warn }}
                        animate={a.severity === "critical" ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-gray-700 truncate max-w-[130px]">{a.vendor}</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color: a.severity === "critical" ? danger : warn }}>
                      ${(a.amount / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: purple }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span style={{ color: purple }} className="font-semibold">Auditing active</span>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
