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
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, Cell } from "recharts";

const purple = "#6366f1";
const green = "#22c55e";
const warn = "#f59e0b";
const danger = "#ef4444";
const textPrimary = "#1e1b4b";
const textSecondary = "#6b7280";

const glass = "backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl shadow-lg shadow-indigo-500/5";

type PillarKey = "arbitrage" | "priceDrift" | "inventory" | "spending" | "vendor" | "integrity";

const pillars: { key: PillarKey; label: string; icon: typeof Zap; color: string; badge: number | string }[] = [
  { key: "arbitrage", label: "Arbitrage & Best Price", icon: Zap, color: purple, badge: 4 },
  { key: "priceDrift", label: "Price Drift", icon: TrendingDown, color: purple, badge: 3 },
  { key: "inventory", label: "Predictive Ordering", icon: BarChart3, color: purple, badge: 2 },
  { key: "spending", label: "Spending Patterns", icon: TrendingDown, color: purple, badge: 1 },
  { key: "vendor", label: "Vendor Consolidation", icon: Users, color: purple, badge: 3 },
  { key: "integrity", label: "Anomaly & Risk", icon: Shield, color: purple, badge: 2 },
];

export default function Glassmorphism() {
  const [active, setActive] = useState<PillarKey>("arbitrage");

  const criticalCount = integrityAlerts.filter((a) => a.severity === "critical").length;
  const highCount = integrityAlerts.filter((a) => a.severity === "high").length;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #eef2ff 100%)", color: textPrimary }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">

        {/* 6 Pillar Cards */}
        <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-6 gap-3 mb-6">
          {pillars.map((p, i) => {
            const isActive = active === p.key;
            return (
              <motion.button
                key={p.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActive(p.key)}
                className={`${glass} p-4 text-left cursor-pointer transition-all relative ${isActive ? "ring-2 ring-indigo-400 bg-white/90" : "hover:bg-white/80"}`}
              >
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: purple }}>
                  {p.badge}
                </div>
                <p.icon size={16} style={{ color: purple }} />
                <div className="text-[10px] uppercase tracking-widest font-semibold mt-2" style={{ color: isActive ? purple : textSecondary }}>
                  {p.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Detail Content */}
        <div className="max-w-[1400px] mx-auto px-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {active === "arbitrage" && <ArbitrageReport />}
              {active === "priceDrift" && <PriceDriftReport />}
              {active === "inventory" && <InventoryReport />}
              {active === "spending" && <SpendingReport />}
              {active === "vendor" && <VendorReport />}
              {active === "integrity" && <IntegrityReport />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Vendor Popover ── */

function VendorPopover({ vendor, isBest }: { vendor: { name: string; price: number; invoiceNo: string; invoiceDate: string; qty: number; total: number }; isBest: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer"
        style={{
          background: isBest ? `${green}12` : "rgba(255,255,255,0.8)",
          border: isBest ? `1.5px solid ${green}55` : "1px solid rgba(0,0,0,0.08)",
          color: isBest ? "#166534" : textSecondary,
          boxShadow: isBest ? `0 2px 8px ${green}20` : "none",
        }}
      >
        {vendor.name}: ${vendor.price} {isBest && "✓"}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 w-64 p-4 rounded-xl shadow-xl shadow-black/10"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Source Invoice</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: textSecondary }}>Invoice #</span>
                  <span className="font-mono font-semibold" style={{ color: textPrimary }}>{vendor.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: textSecondary }}>Date</span>
                  <span className="font-mono" style={{ color: textPrimary }}>{vendor.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: textSecondary }}>Unit Price</span>
                  <span className="font-mono font-semibold" style={{ color: isBest ? green : textPrimary }}>${vendor.price}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: textSecondary }}>Quantity</span>
                  <span className="font-mono" style={{ color: textPrimary }}>{vendor.qty}</span>
                </div>
                <div className="h-px my-1" style={{ background: "rgba(0,0,0,0.06)" }} />
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ color: textSecondary }}>Total</span>
                  <span className="font-mono font-bold" style={{ color: textPrimary }}>${vendor.total.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function QtyPopover({ monthlyQty, vendors }: { monthlyQty: number; vendors: { name: string; price: number; invoiceNo: string; invoiceDate: string; qty: number; total: number }[] }) {
  const [open, setOpen] = useState(false);
  const totalFromInvoices = vendors.reduce((s, v) => s + v.qty, 0);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-left cursor-pointer">
        <div className="uppercase tracking-wider text-[11px]" style={{ color: textSecondary }}>Qty/Month</div>
        <div className="text-base font-mono font-semibold" style={{ color: textPrimary }}>{monthlyQty}</div>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 p-4 rounded-xl shadow-xl shadow-black/10"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Qty Sources — All Vendors</div>
              <div className="space-y-2 text-xs">
                {vendors.map((v, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <div>
                      <div className="font-medium" style={{ color: textPrimary }}>{v.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: textSecondary }}>{v.invoiceNo} · {v.invoiceDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold" style={{ color: textPrimary }}>{v.qty} units</div>
                      <div className="text-[10px] font-mono" style={{ color: textSecondary }}>${v.total.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <div className="h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
                <div className="flex justify-between font-semibold pt-1">
                  <span style={{ color: textSecondary }}>Total from invoices</span>
                  <span className="font-mono" style={{ color: textPrimary }}>{totalFromInvoices} units</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Report Components ── */

function ArbitrageReport() {
  return (
    <div className="grid gap-3">
      {arbitrageOpportunities.map((opp) => (
        <div key={opp.id} className={`${glass} px-5 py-4 transition-all hover:shadow-xl hover:shadow-indigo-500/10`}>
          <div className="flex items-center gap-6">
            {/* Left: Product + Vendors */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${purple}15` }}>
                  <Zap size={13} style={{ color: purple }} />
                </div>
                <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{opp.product}</h4>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {opp.vendors.map((v, i) => (
                  <VendorPopover key={i} vendor={v} isBest={v.price === opp.bestPrice} />
                ))}
              </div>
            </div>

            {/* Right: Metrics */}
            <div className="shrink-0 flex items-center gap-6">
              {/* Annual savings - hero metric */}
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: `${green}08`, border: `1px solid ${green}20` }}>
                <div className="text-2xl font-bold font-mono leading-tight" style={{ color: green }}>${(opp.annualSavings / 1000).toFixed(0)}K</div>
                <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: textSecondary }}>per year</div>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                <div>
                  <div className="uppercase tracking-wider" style={{ color: textSecondary }}>Monthly</div>
                  <div className="text-base font-mono font-semibold" style={{ color: green }}>${opp.monthlySavings.toLocaleString()}</div>
                </div>
                <QtyPopover monthlyQty={opp.monthlyQty} vendors={opp.vendors} />
                <div>
                  <div className="uppercase tracking-wider" style={{ color: textSecondary }}>Lazy Tax</div>
                  <div className="text-base font-mono font-semibold" style={{ color: danger }}>${opp.lazyTax}<span className="text-[10px]">/unit</span></div>
                </div>
                <div>
                  <div className="uppercase tracking-wider" style={{ color: textSecondary }}>Overpaying</div>
                  <div className="text-base font-mono font-semibold" style={{ color: danger }}>{((opp.lazyTax / opp.bestPrice) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceDriftReport() {
  return (
    <div className={`${glass} p-6`}>
      <h3 className="text-sm font-semibold mb-5 flex items-center gap-2"><TrendingDown size={14} style={{ color: purple }} /> Price Drift Monitor</h3>
      <div className="overflow-hidden rounded-xl" style={{ background: "rgba(0,0,0,0.02)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200/50 text-left text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3 text-right">Current</th>
              <th className="px-5 py-3 text-right">90-Day Avg</th>
              <th className="px-5 py-3 text-right">Drift</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {priceDriftItems.map((item) => {
              const statusColor = item.status === "alert" ? danger : item.status === "warning" ? warn : green;
              return (
                <tr key={item.id} className="border-b border-gray-100/50">
                  <td className="px-5 py-3.5 font-medium" style={{ color: textPrimary }}>{item.product}</td>
                  <td className="px-5 py-3.5" style={{ color: textSecondary }}>{item.vendor}</td>
                  <td className="px-5 py-3.5 text-right font-mono">${item.currentPrice}</td>
                  <td className="px-5 py-3.5 text-right font-mono" style={{ color: textSecondary }}>${item.avg90Day}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-semibold" style={{ color: statusColor }}>+{item.driftPercent}%</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>{item.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryReport() {
  return (
    <div className={`${glass} p-6`}>
      <h3 className="text-sm font-semibold mb-5 flex items-center gap-2"><BarChart3 size={14} style={{ color: purple }} /> Predictive Ordering</h3>
      <div className="grid gap-4">
        {inventoryItems.map((item) => {
          const urgencyColor = item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green;
          return (
            <div key={item.id} className="p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{item.product}</h4>
                <span className="text-lg font-bold font-mono" style={{ color: urgencyColor }}>{item.daysRemaining}d</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>Burn Rate</div>
                  <div className="font-mono font-semibold" style={{ color: textPrimary }}>{item.burnRate}/day</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>Stock</div>
                  <div className="font-mono font-semibold" style={{ color: textPrimary }}>{item.currentStock} units</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>Bulk Discount</div>
                  <div className="font-mono font-semibold" style={{ color: item.bulkDiscount > 0 ? green : "#9ca3af" }}>
                    {item.bulkDiscount > 0 ? `${item.bulkDiscount}%` : "—"}
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`, backgroundColor: urgencyColor }} />
              </div>
              <p className="text-xs rounded-lg px-3 py-2" style={{ color: textSecondary, background: "rgba(0,0,0,0.03)" }}>{item.suggestedAction}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendingReport() {
  const latestMargin = spendingTrends[spendingTrends.length - 1].margin;
  return (
    <div className={`${glass} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingDown size={14} style={{ color: purple }} /> Spending Patterns</h3>
        <span className="text-sm" style={{ color: danger }}>Margin erosion: {summaryStats.marginErosion}pp</span>
      </div>
      <div className="h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spendingTrends}>
            <defs>
              <linearGradient id="gl-spend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={purple} stopOpacity={0.15} />
                <stop offset="100%" stopColor={purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: textSecondary }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1e6}M`} />
            <RechartsTooltip formatter={(v: number) => `$${(v / 1e6).toFixed(2)}M`} />
            <Area type="monotone" dataKey="costs" stroke={purple} fill="url(#gl-spend)" strokeWidth={2} name="Total Spend" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {spendingTrends.map((t) => (
          <div key={t.period} className="text-center p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: textSecondary }}>{t.period}</div>
            <div className="text-lg font-bold" style={{ color: t.margin >= 28 ? green : t.margin >= 24 ? warn : danger }}>{t.margin}%</div>
            <div className="text-[10px]" style={{ color: textSecondary }}>margin</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorReport() {
  const totalSavings = vendorConsolidation.reduce((s, v) => s + v.potentialSavings, 0);
  return (
    <div className={`${glass} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Users size={14} style={{ color: purple }} /> Vendor Consolidation</h3>
        <span className="text-sm font-mono font-bold" style={{ color: green }}>${(totalSavings / 1000).toFixed(0)}K potential savings</span>
      </div>
      <div className="h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={vendorConsolidation} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11, fill: textSecondary }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: textSecondary }} axisLine={false} tickLine={false} width={100} />
            <RechartsTooltip />
            <Bar dataKey="vendorCount" radius={[0, 6, 6, 0]} barSize={14} name="Your Vendors">
              {vendorConsolidation.map((entry, i) => (
                <Cell key={i} fill={entry.redundancyScore > 70 ? danger : entry.redundancyScore > 50 ? warn : green} />
              ))}
            </Bar>
            <Bar dataKey="industryAvg" radius={[0, 6, 6, 0]} barSize={14} fill="#e5e7eb" name="Industry Avg" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3">
        {vendorConsolidation.map((v, i) => {
          const scoreColor = v.redundancyScore > 70 ? danger : v.redundancyScore > 50 ? warn : green;
          return (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
              <span className="text-xs font-medium" style={{ color: textPrimary }}>{v.category}</span>
              <div className="flex items-center gap-4 text-[10px]">
                <span style={{ color: textSecondary }}>Yours: <span className="font-mono font-semibold" style={{ color: scoreColor }}>{v.vendorCount}</span></span>
                <span style={{ color: textSecondary }}>Avg: <span className="font-mono">{v.industryAvg}</span></span>
                <span className="font-mono font-bold" style={{ color: green }}>${(v.potentialSavings / 1000).toFixed(0)}K</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntegrityReport() {
  const criticalCount = integrityAlerts.filter((a) => a.severity === "critical").length;
  const highCount = integrityAlerts.filter((a) => a.severity === "high").length;
  return (
    <div className={`${glass} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Shield size={14} style={{ color: danger }} /> Anomaly & Risk</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: danger }} /> {criticalCount} Critical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: warn }} /> {highCount} High</span>
        </div>
      </div>
      <div className="grid gap-4">
        {integrityAlerts.map((a) => (
          <div key={a.id} className="p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: a.severity === "critical" ? `${danger}15` : a.severity === "high" ? `${warn}15` : `${purple}15`,
                      color: a.severity === "critical" ? danger : a.severity === "high" ? warn : purple,
                    }}>{a.severity}</span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>{a.type.replace(/_/g, " ")}</span>
                </div>
                <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{a.vendor}</h4>
              </div>
              <span className="text-base font-bold font-mono" style={{ color: a.severity === "critical" ? danger : warn }}>${a.amount.toLocaleString()}</span>
            </div>
            <p className="text-xs mb-1" style={{ color: textSecondary }}>{a.description}</p>
            <div className="text-[10px]" style={{ color: "#9ca3af" }}>Detected: {a.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
