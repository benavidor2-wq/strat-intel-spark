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
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

const gold = "#d4af37";
const cream = "#f5f0e8";
const navy = "#0d1b2a";
const darkNavy = "#060f1a";
const muted = "#8a7e6b";
const danger = "#c0392b";
const success = "#27ae60";

const decoCard = `p-6 rounded-none border`;
const decoStyle = { borderColor: `${gold}33`, background: darkNavy };

export default function NeoArtDeco() {
  return (
    <div className="min-h-screen" style={{ background: navy, color: cream, fontFamily: "'Inter', sans-serif" }}>
      {/* Header with art deco lines */}
      <div className="relative px-8 pt-12 pb-8 text-center" style={{ borderBottom: `1px solid ${gold}33` }}>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px flex-1 max-w-32" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
          <div className="w-3 h-3 rotate-45" style={{ border: `1px solid ${gold}`, background: "transparent" }} />
          <div className="h-px flex-1 max-w-32" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
        </div>
        <h1 className="text-3xl font-light tracking-[0.25em] uppercase" style={{ color: gold }}>
          Strategic Intelligence
        </h1>
        <p className="text-xs tracking-[0.4em] uppercase mt-2" style={{ color: muted }}>Autonomous Financial Oversight</p>

        <div className="flex justify-center gap-12 mt-8">
          {[
            { value: summaryStats.criticalAlerts, label: "Critical", color: danger },
            { value: `$${(summaryStats.totalLazyTax / 1000).toFixed(0)}K`, label: "Lazy Tax", color: gold },
            { value: `$${(summaryStats.totalPotentialSavings / 1000).toFixed(0)}K`, label: "Potential Savings", color: success },
            { value: `${summaryStats.marginErosion}pp`, label: "Margin Shift", color: danger },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
              <div className="text-3xl font-light" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] mt-1" style={{ color: muted }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px flex-1 max-w-48" style={{ background: `linear-gradient(90deg, transparent, ${gold}33)` }} />
          <div className="w-2 h-2 rotate-45" style={{ background: gold }} />
          <div className="h-px flex-1 max-w-48" style={{ background: `linear-gradient(90deg, ${gold}33, transparent)` }} />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 grid grid-cols-3 gap-6">
        {/* Pillar 1: Integrity */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Integrity Layer</span>
          </div>
          <div className="space-y-4">
            {integrityAlerts.slice(0, 4).map((a) => (
              <div key={a.id} className="pl-4" style={{ borderLeft: `2px solid ${a.severity === "critical" ? danger : gold}` }}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: cream }}>{a.vendor}</span>
                  <span style={{ color: a.severity === "critical" ? danger : gold }}>${a.amount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: muted }}>{a.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 2: Price Drift */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Price Drift</span>
          </div>
          <div className="space-y-3">
            {priceDriftItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate" style={{ color: cream }}>{item.product}</span>
                <div className="flex-1 h-1 overflow-hidden" style={{ background: `${gold}15` }}>
                  <div className="h-full" style={{
                    width: `${Math.min(item.driftPercent * 6, 100)}%`,
                    background: item.status === "alert" ? danger : item.status === "warning" ? gold : success,
                  }} />
                </div>
                <span className="font-mono w-12 text-right" style={{ color: item.status === "alert" ? danger : item.status === "warning" ? gold : success }}>
                  +{item.driftPercent}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 3: Arbitrage */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Arbitrage</span>
          </div>
          <div className="space-y-4">
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id}>
                <div className="text-xs font-medium mb-1" style={{ color: cream }}>{opp.product}</div>
                <div className="flex gap-1 mb-1">
                  {opp.vendors.map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5" style={{
                      background: v.price === opp.bestPrice ? `${success}22` : `${gold}11`,
                      border: `1px solid ${v.price === opp.bestPrice ? `${success}44` : `${gold}22`}`,
                      color: v.price === opp.bestPrice ? success : muted,
                    }}>
                      {v.name}: ${v.price}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] flex justify-between" style={{ color: muted }}>
                  <span>Tax: <span style={{ color: danger }}>${opp.lazyTax}</span></span>
                  <span style={{ color: success }}>${(opp.annualSavings / 1000).toFixed(0)}K/yr</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pillar 4: Inventory */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Predictive Ordering</span>
          </div>
          {inventoryItems.map((item) => (
            <div key={item.id} className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: cream }}>{item.product}</span>
                <span className="font-mono" style={{ color: item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? gold : success }}>
                  {item.daysRemaining}d
                </span>
              </div>
              <div className="h-1 overflow-hidden" style={{ background: `${gold}15` }}>
                <div className="h-full" style={{
                  width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                  background: item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? gold : success,
                }} />
              </div>
              <p className="text-[9px] mt-1" style={{ color: muted }}>{item.suggestedAction}</p>
            </div>
          ))}
        </motion.div>

        {/* Pillar 5: Spending */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Margin Trends</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="ad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gold} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1e6}M`} />
                <Area type="monotone" dataKey="revenue" stroke={gold} fill="url(#ad-rev)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="costs" stroke={danger} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pillar 6: Vendor Consolidation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className={decoCard} style={decoStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px" style={{ background: gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>Vendor Bloat</span>
          </div>
          <div className="space-y-3">
            {vendorConsolidation.map((v) => (
              <div key={v.category} className="flex items-center gap-3">
                <div className="text-2xl font-light w-8 text-center" style={{
                  color: v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? gold : success,
                }}>{v.vendorCount}</div>
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: cream }}>{v.category}</div>
                  <div className="text-[10px]" style={{ color: muted }}>
                    Benchmark: {v.industryAvg} | Save ${(v.potentialSavings / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
