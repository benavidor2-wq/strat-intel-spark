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

const green = "#00ff41";
const dimGreen = "#00aa2a";
const darkGreen = "#004d1a";
const amber = "#ffb300";
const red = "#ff3333";

const mono = "'Courier New', 'Consolas', monospace";

const Section = ({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} className="border p-4" style={{ borderColor: darkGreen }}>
    <div className="text-xs mb-3 pb-1 border-b" style={{ color: dimGreen, borderColor: darkGreen }}>
      ┌─ {title} ─────────────────────────────────────
    </div>
    {children}
    <div className="text-xs mt-3" style={{ color: darkGreen }}>└───────────────────────────────────────────────</div>
  </motion.div>
);

export default function RetroTerminal() {
  return (
    <div className="min-h-screen relative" style={{ background: "#0a0a0a", color: green, fontFamily: mono, fontSize: "12px" }}>
      {/* CRT scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      }} />
      {/* CRT glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        boxShadow: "inset 0 0 100px rgba(0,255,65,0.05)",
      }} />

      <div className="relative z-10 max-w-[1200px] mx-auto p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <pre style={{ color: green, fontSize: "10px", lineHeight: 1.2 }}>{`
 ███╗   ███╗██╗   ██╗ ██████╗███████╗ ██████╗ 
 ████╗ ████║╚██╗ ██╔╝██╔════╝██╔════╝██╔═══██╗
 ██╔████╔██║ ╚████╔╝ ██║     █████╗  ██║   ██║
 ██║╚██╔╝██║  ╚██╔╝  ██║     ██╔══╝  ██║   ██║
 ██║ ╚═╝ ██║   ██║   ╚██████╗██║     ╚██████╔╝
 ╚═╝     ╚═╝   ╚═╝    ╚═════╝╚═╝      ╚═════╝`}</pre>
          <div className="mt-2" style={{ color: dimGreen }}>
            STRATEGIC INTELLIGENCE ENGINE v2.6.1 | Session: {new Date().toISOString()} | Status: <span style={{ color: green }}>ACTIVE</span>
          </div>
          <div className="mt-1" style={{ color: darkGreen }}>
            ════════════════════════════════════════════════════════════════════
          </div>
          <div className="flex gap-8 mt-2">
            <span>CRITICAL_ALERTS: <span style={{ color: red }}>{summaryStats.criticalAlerts}</span></span>
            <span>LAZY_TAX: <span style={{ color: amber }}>${summaryStats.totalLazyTax.toLocaleString()}</span></span>
            <span>SAVINGS_POTENTIAL: <span style={{ color: green }}>${summaryStats.totalPotentialSavings.toLocaleString()}</span></span>
            <span>MARGIN_DELTA: <span style={{ color: red }}>{summaryStats.marginErosion}pp</span></span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {/* Integrity */}
          <Section title="PILLAR_01: FORENSIC_INTEGRITY" delay={0.2}>
            {integrityAlerts.map((a) => (
              <div key={a.id} className="mb-2">
                <span style={{ color: a.severity === "critical" ? red : amber }}>
                  [{a.severity.toUpperCase()}]
                </span>{" "}
                <span style={{ color: green }}>{a.vendor}</span>
                <br />
                <span style={{ color: darkGreen }}>  ├─ type: {a.type}</span>
                <br />
                <span style={{ color: darkGreen }}>  ├─ amount: ${a.amount.toLocaleString()}</span>
                <br />
                <span style={{ color: darkGreen }}>  └─ {a.description}</span>
              </div>
            ))}
          </Section>

          {/* Price Drift */}
          <Section title="PILLAR_02: PRICE_DRIFT_MONITOR" delay={0.3}>
            <div className="mb-2" style={{ color: dimGreen }}>
              {"PRODUCT".padEnd(22)} {"VENDOR".padEnd(12)} {"CURR".padStart(8)} {"AVG90".padStart(8)} {"DRIFT".padStart(8)} STATUS
            </div>
            {priceDriftItems.map((item) => (
              <div key={item.id}>
                <span>{item.product.padEnd(22).slice(0, 22)}</span>
                <span style={{ color: dimGreen }}>{item.vendor.padEnd(12).slice(0, 12)}</span>
                <span>{`$${item.currentPrice}`.padStart(8)}</span>
                <span style={{ color: dimGreen }}>{`$${item.avg90Day}`.padStart(8)}</span>
                <span style={{ color: item.status === "alert" ? red : item.status === "warning" ? amber : green }}>
                  {`+${item.driftPercent}%`.padStart(8)}
                </span>
                {" "}
                <span style={{ color: item.status === "alert" ? red : item.status === "warning" ? amber : green }}>
                  {item.status === "alert" ? "▲▲▲" : item.status === "warning" ? "▲▲░" : "▲░░"}
                </span>
              </div>
            ))}
          </Section>

          {/* Arbitrage */}
          <Section title="PILLAR_03: CROSS_VENDOR_ARBITRAGE" delay={0.4}>
            {arbitrageOpportunities.map((opp) => (
              <div key={opp.id} className="mb-3">
                <span style={{ color: green }}>► {opp.product}</span>
                <br />
                {opp.vendors.map((v, i) => (
                  <span key={i}>
                    <span style={{ color: darkGreen }}>  {v.price === opp.bestPrice ? "★" : "○"} </span>
                    <span style={{ color: v.price === opp.bestPrice ? green : dimGreen }}>
                      {v.name}: ${v.price}
                    </span>
                    <br />
                  </span>
                ))}
                <span style={{ color: darkGreen }}>  └─ lazy_tax: </span>
                <span style={{ color: amber }}>${opp.lazyTax}/unit</span>
                <span style={{ color: darkGreen }}> | annual_savings: </span>
                <span style={{ color: green }}>${opp.annualSavings.toLocaleString()}</span>
              </div>
            ))}
          </Section>

          {/* Inventory */}
          <Section title="PILLAR_04: PREDICTIVE_ORDERING" delay={0.5}>
            {inventoryItems.map((item) => {
              const barLen = Math.round((item.daysRemaining / 40) * 20);
              const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);
              return (
                <div key={item.id} className="mb-2">
                  <span style={{ color: green }}>{item.product.padEnd(16).slice(0, 16)}</span>
                  <span style={{ color: item.daysRemaining <= 7 ? red : item.daysRemaining <= 15 ? amber : green }}>
                    [{bar}] {item.daysRemaining}d
                  </span>
                  <br />
                  <span style={{ color: darkGreen }}>{"".padEnd(16)}└─ {item.suggestedAction}</span>
                </div>
              );
            })}
          </Section>

          {/* Spending */}
          <Section title="PILLAR_05: SPENDING_TRENDS" delay={0.6}>
            {spendingTrends.map((s) => {
              const revBar = Math.round((s.revenue / 3500000) * 30);
              const costBar = Math.round((s.costs / 3500000) * 30);
              return (
                <div key={s.period} className="mb-1">
                  <span style={{ color: dimGreen }}>{s.period} </span>
                  <span style={{ color: green }}>{"█".repeat(revBar)}</span>
                  <span style={{ color: red }}>{"█".repeat(costBar)}</span>
                  <span style={{ color: dimGreen }}> m:{s.margin}%</span>
                </div>
              );
            })}
            <div className="mt-2" style={{ color: red }}>
              ⚠ MARGIN EROSION: {summaryStats.marginErosion}pp over 5 quarters — costs outpacing revenue
            </div>
          </Section>

          {/* Vendor Consolidation */}
          <Section title="PILLAR_06: VENDOR_CONSOLIDATION" delay={0.7}>
            <div className="mb-2" style={{ color: dimGreen }}>
              {"CATEGORY".padEnd(18)} {"VENDORS".padStart(8)} {"IND_AVG".padStart(8)} {"BLOAT".padStart(8)} {"SAVINGS".padStart(10)}
            </div>
            {vendorConsolidation.map((v) => (
              <div key={v.category}>
                <span>{v.category.padEnd(18).slice(0, 18)}</span>
                <span style={{ color: v.redundancyScore > 70 ? red : v.redundancyScore > 50 ? amber : green }}>
                  {String(v.vendorCount).padStart(8)}
                </span>
                <span style={{ color: dimGreen }}>{String(v.industryAvg).padStart(8)}</span>
                <span style={{ color: v.redundancyScore > 70 ? red : v.redundancyScore > 50 ? amber : green }}>
                  {`${v.redundancyScore}%`.padStart(8)}
                </span>
                <span style={{ color: green }}>{`$${(v.potentialSavings / 1000).toFixed(0)}K`.padStart(10)}</span>
              </div>
            ))}
            <div className="mt-2" style={{ color: amber }}>
              TOTAL_VENDORS: {summaryStats.activeVendors} | INDUSTRY_AVG: {summaryStats.industryAvgVendors} | BLOAT_RATIO: {(summaryStats.activeVendors / summaryStats.industryAvgVendors).toFixed(1)}x
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-4" style={{ color: darkGreen }}>
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>█</motion.span>{" "}
          SYSTEM READY — All pillars operational
        </div>
      </div>
    </div>
  );
}
