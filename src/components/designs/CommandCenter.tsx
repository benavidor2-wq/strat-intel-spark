import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  integrityAlerts,
  priceDriftItems,
  arbitrageOpportunities,
  inventoryItems,
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
          className="h-[calc(100vh-40px)] flex flex-col overflow-hidden"
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
          <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-3 grid grid-cols-3 grid-rows-2 gap-3">
            <PillarCard
              icon={Shield} iconColor={danger}
              title="Integrity Layer" subtitle={`${criticalCount} critical alerts requiring immediate review`}
              metric={`$${(integrityAlerts.reduce((s, a) => s + a.amount, 0) / 1000).toFixed(0)}K`}
              metricColor={danger} metricLabel="at risk"
              onClick={() => setActivePillar("integrity")} delay={0.1}
            >
              <div className="flex gap-1">
                {integrityAlerts.slice(0, 3).map((a) => (
                  <span key={a.id} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: a.severity === "critical" ? `${danger}15` : `${warn}15`, color: a.severity === "critical" ? danger : warn }}>
                    {a.vendor.split(" ")[0]}
                  </span>
                ))}
              </div>
            </PillarCard>

            <PillarCard
              icon={TrendingDown} iconColor={purple}
              title="Price Drift" subtitle={`${alertDriftCount} products with significant price increases`}
              metric={`${alertDriftCount}`}
              metricColor={danger} metricLabel="alerts"
              onClick={() => setActivePillar("priceDrift")} delay={0.2}
            >
              <div className="flex gap-1">
                {priceDriftItems.filter(p => p.status === "alert").slice(0, 3).map((p) => (
                  <span key={p.id} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${danger}15`, color: danger }}>
                    +{p.driftPercent}%
                  </span>
                ))}
              </div>
            </PillarCard>

            <PillarCard
              icon={Zap} iconColor={green}
              title="Arbitrage" subtitle="Savings from switching to lower-cost vendors"
              metric={`$${(summaryStats.totalLazyTax / 1000).toFixed(0)}K`}
              metricColor={warn} metricLabel="lazy tax / yr"
              onClick={() => setActivePillar("arbitrage")} delay={0.3}
            >
              <div className="flex gap-1">
                {arbitrageOpportunities.slice(0, 3).map((o) => (
                  <span key={o.id} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${green}15`, color: green }}>
                    ${(o.annualSavings / 1000).toFixed(0)}K
                  </span>
                ))}
              </div>
            </PillarCard>

            <PillarCard
              icon={BarChart3} iconColor={green}
              title="Predictive Ordering" subtitle={`${urgentInventory} items critically low on stock`}
              metric={`${urgentInventory}`}
              metricColor={danger} metricLabel="urgent"
              onClick={() => setActivePillar("inventory")} delay={0.4}
            >
              <div className="flex gap-1">
                {inventoryItems.filter(i => i.daysRemaining <= 7).map((i) => (
                  <span key={i.id} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${danger}15`, color: danger }}>
                    {i.product}
                  </span>
                ))}
              </div>
            </PillarCard>

            <PillarCard
              icon={TrendingDown} iconColor={purple}
              title="Margin Erosion" subtitle="Costs outpacing revenue growth over 5 quarters"
              metric={`${summaryStats.marginErosion}pp`}
              metricColor={danger} metricLabel="margin loss"
              onClick={() => setActivePillar("spending")} delay={0.5}
            >
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.abs(summaryStats.marginErosion) * 8}%`, backgroundColor: danger }} />
              </div>
            </PillarCard>

            <PillarCard
              icon={Users} iconColor={purple}
              title="Vendor Bloat" subtitle={`${summaryStats.activeVendors} active vendors vs ${summaryStats.industryAvgVendors} industry avg`}
              metric={`${summaryStats.vendorBloatScore}%`}
              metricColor={warn} metricLabel="bloat score"
              onClick={() => setActivePillar("vendor")} delay={0.6}
            >
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${summaryStats.vendorBloatScore}%`, backgroundColor: warn }} />
              </div>
            </PillarCard>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
