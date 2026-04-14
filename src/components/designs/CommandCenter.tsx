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
import { Shield, TrendingDown, Zap, BarChart3, Users } from "lucide-react";
import PillarCard from "./command-center/PillarCard";
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

export default function CommandCenter() {
  const [activePillar, setActivePillar] = useState<Pillar>(null);
  const goBack = () => setActivePillar(null);

  const criticalCount = integrityAlerts.filter((a) => a.severity === "critical").length;
  const alertDriftCount = priceDriftItems.filter((p) => p.status === "alert").length;
  const urgentInventory = inventoryItems.filter((i) => i.daysRemaining <= 7).length;

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
              <div className="flex gap-6 text-xs uppercase tracking-wider">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: danger }}>{summaryStats.criticalAlerts}</div>
                  <div className="text-gray-500">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: warn }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K</div>
                  <div className="text-gray-500">Lazy Tax</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: green }}>${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K</div>
                  <div className="text-gray-500">Savings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Grid */}
          <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-6 pt-3 pb-2 grid grid-cols-3 grid-rows-2 gap-3">
            {/* Integrity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("integrity")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={15} style={{ color: danger }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: danger }}>Integrity Layer</span>
                </div>
                <span className="text-xl font-bold" style={{ color: danger }}>${(integrityAlerts.reduce((s, a) => s + a.amount, 0) / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex-1 space-y-1.5 mt-1">
                {integrityAlerts.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.severity === "critical" ? danger : warn }} />
                      <span className="text-gray-700 truncate max-w-[140px]">{a.vendor}</span>
                    </div>
                    <span className="font-mono font-semibold" style={{ color: a.severity === "critical" ? danger : warn }}>${(a.amount / 1000).toFixed(1)}K</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>{criticalCount} critical · {integrityAlerts.length - criticalCount} high</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* Price Drift */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("priceDrift")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown size={15} style={{ color: purple }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Price Drift</span>
                </div>
                <span className="text-xl font-bold" style={{ color: danger }}>{alertDriftCount} <span className="text-[10px] font-normal text-gray-400">alerts</span></span>
              </div>
              <div className="flex-1 space-y-2 mt-1">
                {priceDriftItems.slice(0, 5).map((item) => {
                  const barColor = item.status === "alert" ? danger : item.status === "warning" ? warn : green;
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-600 truncate w-[90px]">{item.product}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(item.driftPercent * 6, 100)}%`, backgroundColor: barColor }} />
                      </div>
                      <span className="font-mono font-semibold w-10 text-right" style={{ color: barColor }}>+{item.driftPercent}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>{priceDriftItems.length} products tracked</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* Arbitrage */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("arbitrage")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={15} style={{ color: green }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: green }}>Arbitrage</span>
                </div>
                <span className="text-xl font-bold" style={{ color: warn }}>${(summaryStats.totalLazyTax / 1000).toFixed(0)}K <span className="text-[10px] font-normal text-gray-400">/yr</span></span>
              </div>
              <div className="flex-1 space-y-1.5 mt-1">
                {arbitrageOpportunities.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <span className="text-gray-700 truncate max-w-[140px]">{opp.product}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-400 line-through">${opp.currentPrice}</span>
                      <span className="font-mono font-semibold" style={{ color: green }}>${opp.bestPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>Total savings: <span style={{ color: green }} className="font-semibold">${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K/yr</span></span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* Predictive Ordering */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("inventory")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} style={{ color: green }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: green }}>Predictive Ordering</span>
                </div>
                <span className="text-xl font-bold" style={{ color: danger }}>{urgentInventory} <span className="text-[10px] font-normal text-gray-400">urgent</span></span>
              </div>
              <div className="flex-1 space-y-2 mt-1">
                {inventoryItems.slice(0, 4).map((item) => {
                  const urgColor = item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green;
                  return (
                    <div key={item.id}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-gray-600">{item.product}</span>
                        <span className="font-mono font-semibold" style={{ color: urgColor }}>{item.daysRemaining}d</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`, backgroundColor: urgColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>{inventoryItems.length} items monitored</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* Margin Erosion */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("spending")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown size={15} style={{ color: purple }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Margin Erosion</span>
                </div>
                <span className="text-xl font-bold" style={{ color: danger }}>{summaryStats.marginErosion}pp</span>
              </div>
              <div className="flex-1 mt-1">
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
              <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                <span>Revenue vs Costs · 5 quarters</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>

            {/* Vendor Bloat */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              onClick={() => setActivePillar("vendor")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={15} style={{ color: purple }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: purple }}>Vendor Bloat</span>
                </div>
                <span className="text-xl font-bold" style={{ color: warn }}>{summaryStats.vendorBloatScore}%</span>
              </div>
              <div className="flex-1 space-y-2 mt-1">
                {vendorConsolidation.map((v, i) => {
                  const scoreColor = v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? warn : green;
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-600 truncate w-[80px]">{v.category}</span>
                      <div className="flex-1 flex gap-0.5 items-end h-3">
                        <div className="flex-1 rounded-sm" style={{ height: `${(v.vendorCount / 16) * 100}%`, backgroundColor: scoreColor, minHeight: 3 }} />
                        <div className="flex-1 rounded-sm" style={{ height: `${(v.industryAvg / 16) * 100}%`, backgroundColor: "#e5e7eb", minHeight: 3 }} />
                      </div>
                      <span className="font-mono w-6 text-right" style={{ color: scoreColor }}>{v.vendorCount}</span>
                      <span className="font-mono w-4 text-right text-gray-300">{v.industryAvg}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                <span>{summaryStats.activeVendors} vendors · avg {summaryStats.industryAvgVendors}</span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">View all →</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
