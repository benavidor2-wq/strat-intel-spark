import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  integrityAlerts,
  priceDriftItems,
  arbitrageOpportunities,
  spendingTrends,
  vendorConsolidation,
  vendorMonthlySpend,
  spendByCategory,
  summaryStats,
  vendorProducts,
  categoryVendors,
  type PriceDriftItem,
} from "@/data/mockData";
import { ArrowLeft, Shield, TrendingDown, Zap, Users, Gift, Send, X, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, Cell, PieChart, Pie } from "recharts";

const purple = "#6366f1";
const green = "#22c55e";
const warn = "#f59e0b";
const danger = "#ef4444";
const textPrimary = "#1e1b4b";
const textSecondary = "#6b7280";

const glass = "backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl shadow-lg shadow-indigo-500/5";

type PillarKey = "arbitrage" | "priceDrift" | "spending" | "vendor" | "integrity";

const pillars: { key: PillarKey; label: string; icon: typeof Zap; color: string; badge: number | string }[] = [
  { key: "arbitrage", label: "Vendor Arbitrage & Best Pricing", icon: Zap, color: purple, badge: 4 },
  { key: "priceDrift", label: "Price Drift", icon: TrendingDown, color: purple, badge: 3 },
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
        <div className="max-w-[1400px] mx-auto px-8 pt-6 grid grid-cols-5 gap-3 mb-6">
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

        {/* Chat Bar */}
        <div className="max-w-[1400px] mx-auto px-8 mb-6">
          <div className={`${glass} flex items-center gap-4 px-5 py-2.5`}>
            <input
              type="text"
              placeholder='Ask your CFO... e.g. "Which vendor has the highest cost increase?"'
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              style={{ color: textPrimary }}
            />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: `${purple}88` }}>
              <Send size={18} className="text-white" />
            </button>
          </div>
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
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground"
              data-parsed-invoice-popover="invoiceNo invoiceDate total"
            >
              {/* Claude breadcrumb: parsed invoice data should map at minimum to invoiceNo, invoiceDate, and total amount. */}
              <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
                <header className="flex items-center justify-between border-b border-border pb-5">
                  <button onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    <ArrowLeft size={16} />
                    Back to vendors
                  </button>
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">Parsed invoice</span>
                </header>

                <main className="grid flex-1 gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
                  <section className="flex min-h-[520px] flex-col rounded-2xl border border-border bg-card p-7 text-card-foreground shadow-xl">
                    <div className="mb-8 flex items-start justify-between gap-6 border-b border-border pb-6">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Invoice</div>
                        <h2 className="mt-2 text-3xl font-bold tracking-normal text-foreground">{vendor.invoiceNo}</h2>
                        <p className="mt-2 text-sm font-medium text-muted-foreground">Parsed from {vendor.name}</p>
                      </div>
                      <div className="rounded-2xl bg-muted p-4">
                        <FileText className="h-9 w-9 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-xl border border-border bg-muted p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Number</div>
                        <div className="mt-2 break-all font-mono text-base font-bold text-foreground">{vendor.invoiceNo}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Date</div>
                        <div className="mt-2 font-mono text-base font-bold text-foreground">{vendor.invoiceDate}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-primary p-4 text-primary-foreground">
                        <div className="text-[10px] font-bold uppercase tracking-widest">Invoice Amount</div>
                        <div className="mt-2 font-mono text-2xl font-bold">${vendor.total.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8">
                      <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                        Prepared fields for parsed invoice data: invoice number, invoice date, and invoice amount.
                      </div>
                    </div>
                  </section>

                  <aside className="rounded-2xl border border-border bg-card p-7 text-card-foreground shadow-xl">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parsed Line Summary</div>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <span className="text-sm font-medium text-muted-foreground">Unit Price</span>
                        <span className="font-mono text-lg font-bold text-foreground">${vendor.price}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                        <span className="font-mono text-lg font-bold text-foreground">{vendor.qty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Vendor Status</span>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary-foreground">{isBest ? "Best price" : "Compared"}</span>
                      </div>
                    </div>
                  </aside>
                </main>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
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
  const [selectedItem, setSelectedItem] = useState<PriceDriftItem | null>(null);

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
                <tr key={item.id} className="border-b border-gray-100/50 cursor-pointer transition-all hover:bg-white/60" onClick={() => setSelectedItem(item)}>
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

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-6"
              style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: textPrimary }}>{selectedItem.product}</h3>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>Vendor: {selectedItem.vendor} · Drift: <span className="font-mono font-semibold" style={{ color: selectedItem.status === "alert" ? danger : selectedItem.status === "warning" ? warn : green }}>+{selectedItem.driftPercent}%</span></p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                  <X size={16} style={{ color: textSecondary }} />
                </button>
              </div>

              {/* Most Recent Invoice */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} style={{ color: danger }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: danger }}>Most Recent Invoice</span>
                </div>
                <div className="p-4 rounded-xl" style={{ background: `${danger}06`, border: `1px solid ${danger}15` }}>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="uppercase tracking-wider text-[10px]" style={{ color: textSecondary }}>Invoice #</div>
                      <div className="font-mono font-semibold mt-0.5" style={{ color: textPrimary }}>{selectedItem.recentInvoice.invoiceNo}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-[10px]" style={{ color: textSecondary }}>Date</div>
                      <div className="font-mono mt-0.5" style={{ color: textPrimary }}>{selectedItem.recentInvoice.date}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-[10px]" style={{ color: textSecondary }}>Unit Price</div>
                      <div className="font-mono font-bold text-base mt-0.5" style={{ color: danger }}>${selectedItem.recentInvoice.unitPrice}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-[10px]" style={{ color: textSecondary }}>Qty / Total</div>
                      <div className="font-mono font-semibold mt-0.5" style={{ color: textPrimary }}>{selectedItem.recentInvoice.qty} units · ${selectedItem.recentInvoice.total.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Invoices (90 days) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} style={{ color: purple }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: purple }}>Previous 90-Day Invoices</span>
                </div>
                <div className="space-y-2">
                  {selectedItem.historicalInvoices.map((inv, i) => (
                    <div key={i} className="p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <div>
                        <div className="font-mono text-xs font-semibold" style={{ color: textPrimary }}>{inv.invoiceNo}</div>
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: textSecondary }}>{inv.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold" style={{ color: green }}>${inv.unitPrice}</div>
                        <div className="text-[10px] font-mono" style={{ color: textSecondary }}>{inv.qty} units · ${inv.total.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price change summary */}
              <div className="mt-5 p-3 rounded-xl text-xs" style={{ background: `${purple}08`, border: `1px solid ${purple}15` }}>
                <span style={{ color: textSecondary }}>Price increased from </span>
                <span className="font-mono font-bold" style={{ color: green }}>${selectedItem.historicalInvoices[selectedItem.historicalInvoices.length - 1]?.unitPrice}</span>
                <span style={{ color: textSecondary }}> to </span>
                <span className="font-mono font-bold" style={{ color: danger }}>${selectedItem.recentInvoice.unitPrice}</span>
                <span style={{ color: textSecondary }}> over the past 90 days — use these invoices to negotiate back to previous rates.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const vendorTotal = vendorMonthlySpend.reduce((s, v) => s + v.monthlySpend, 0);
  const categoryTotal = spendByCategory.reduce((s, v) => s + v.monthlySpend, 0);
  const vendorColors = [danger, purple, warn, green, "#60a5fa", "#f472b6", "#fbbf24", "#34d399"];
  const categoryColors = [purple, warn, "#60a5fa", green, danger];

  const handleVendorClick = (_: unknown, index: number) => {
    const vendor = vendorMonthlySpend[index].vendor;
    setSelectedVendor(vendor);
    setSelectedCategory(null);
  };

  const handleCategoryClick = (_: unknown, index: number) => {
    const category = spendByCategory[index].category;
    setSelectedCategory(category);
    setSelectedVendor(null);
  };

  const vendorDetail = selectedVendor ? vendorProducts[selectedVendor] : null;
  const vendorSpend = selectedVendor ? vendorMonthlySpend.find(v => v.vendor === selectedVendor) : null;
  const categoryDetail = selectedCategory ? categoryVendors[selectedCategory] : null;
  const categoryConsolidation = selectedCategory ? vendorConsolidation.find(v => v.category === selectedCategory) : null;
  const vendorDriftItems = selectedVendor ? priceDriftItems.filter(p => p.vendor === selectedVendor) : [];

  return (
    <div>
      <div className={`${glass} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Users size={14} style={{ color: purple }} /> Vendor Consolidation</h3>
          <p className="text-xs" style={{ color: textSecondary }}>Click a slice to drill down</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Spend by Vendor */}
          <div>
            <p className="text-xs font-semibold text-center mb-2" style={{ color: textSecondary }}>Spend by Vendor</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorMonthlySpend}
                    dataKey="monthlySpend"
                    nameKey="vendor"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={55}
                    paddingAngle={3}
                    label={({ vendor, percent }) => `${vendor}: ${(percent * 100).toFixed(0)}%`}
                    style={{ fontSize: 10, cursor: 'pointer' }}
                    onClick={handleVendorClick}
                  >
                    {vendorMonthlySpend.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={vendorColors[i % vendorColors.length]}
                        opacity={selectedVendor && selectedVendor !== entry.vendor ? 0.3 : 1}
                        stroke={selectedVendor === entry.vendor ? '#1e1b4b' : 'transparent'}
                        strokeWidth={selectedVendor === entry.vendor ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()} (${((value / vendorTotal) * 100).toFixed(1)}%)`, 'Monthly Spend']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spend by Category */}
          <div>
            <p className="text-xs font-semibold text-center mb-2" style={{ color: textSecondary }}>Spend by Category</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByCategory}
                    dataKey="monthlySpend"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={55}
                    paddingAngle={3}
                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                    style={{ fontSize: 10, cursor: 'pointer' }}
                    onClick={handleCategoryClick}
                  >
                    {spendByCategory.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={categoryColors[i % categoryColors.length]}
                        opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                        stroke={selectedCategory === entry.category ? '#1e1b4b' : 'transparent'}
                        strokeWidth={selectedCategory === entry.category ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()} (${((value / categoryTotal) * 100).toFixed(1)}%)`, 'Monthly Spend']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Panel */}
      <AnimatePresence>
        {selectedVendor && vendorDetail && (
          <motion.div
            key={`vendor-${selectedVendor}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`${glass} p-6 mt-4`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-base font-semibold" style={{ color: textPrimary }}>{selectedVendor}</h4>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>Category: {vendorDetail.category} · Monthly spend: <span className="font-mono font-semibold" style={{ color: purple }}>${vendorSpend?.monthlySpend.toLocaleString()}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Products */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Products Supplied</div>
                  <div className="space-y-2">
                    {vendorDetail.products.map((p, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,0,0,0.03)', color: textPrimary }}>{p}</div>
                    ))}
                  </div>
                </div>

                {/* Recent Invoices */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Recent Invoices</div>
                  <div className="space-y-2">
                    {vendorDetail.recentInvoices.map((inv, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                        <div className="flex justify-between text-xs">
                          <span className="font-mono font-semibold" style={{ color: textPrimary }}>{inv.invoiceNo}</span>
                          <span className="font-mono font-semibold" style={{ color: green }}>${inv.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] mt-1" style={{ color: textSecondary }}>
                          <span>{inv.date}</span>
                          <span>{inv.product} · {inv.qty} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Drift Status */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Price Drift Status</div>
                  {vendorDriftItems.length > 0 ? (
                    <div className="space-y-2">
                      {vendorDriftItems.map((item) => {
                        const statusColor = item.status === 'alert' ? danger : item.status === 'warning' ? warn : green;
                        return (
                          <div key={item.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium" style={{ color: textPrimary }}>{item.product}</span>
                              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>{item.status}</span>
                            </div>
                            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: textSecondary }}>
                              <span>Current: <span className="font-mono font-semibold" style={{ color: statusColor }}>${item.currentPrice}</span></span>
                              <span>Drift: <span className="font-mono font-semibold" style={{ color: statusColor }}>+{item.driftPercent}%</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.03)', color: textSecondary }}>No price drift alerts for this vendor</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedCategory && categoryDetail && (
          <motion.div
            key={`category-${selectedCategory}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`${glass} p-6 mt-4`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-base font-semibold" style={{ color: textPrimary }}>{selectedCategory}</h4>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>{categoryDetail.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Vendors in this category */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Vendors in Category</div>
                  <div className="space-y-2">
                    {categoryDetail.vendors.map((v, i) => {
                      const catTotal = categoryDetail.vendors.reduce((s, x) => s + x.spend, 0);
                      const pct = ((v.spend / catTotal) * 100).toFixed(1);
                      return (
                        <div key={i} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.03)' }}>
                          <div>
                            <div className="text-xs font-medium" style={{ color: textPrimary }}>{v.name}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: textSecondary }}>{pct}% of category spend</div>
                          </div>
                          <div className="text-sm font-mono font-semibold" style={{ color: purple }}>${v.spend.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Consolidation metrics */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: purple }}>Consolidation Analysis</div>
                  {categoryConsolidation ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.03)' }}>
                          <div className="text-xl font-bold" style={{ color: categoryConsolidation.vendorCount > categoryConsolidation.industryAvg * 1.5 ? danger : textPrimary }}>{categoryConsolidation.vendorCount}</div>
                          <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: textSecondary }}>Your Vendors</div>
                        </div>
                        <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.03)' }}>
                          <div className="text-xl font-bold" style={{ color: green }}>{categoryConsolidation.industryAvg}</div>
                          <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: textSecondary }}>Industry Avg</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: textSecondary }}>Redundancy Score</span>
                          <span className="text-sm font-bold font-mono" style={{ color: categoryConsolidation.redundancyScore > 60 ? danger : warn }}>{categoryConsolidation.redundancyScore}/100</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${categoryConsolidation.redundancyScore}%`, backgroundColor: categoryConsolidation.redundancyScore > 60 ? danger : warn }} />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl text-center" style={{ background: `${green}08`, border: `1px solid ${green}20` }}>
                        <div className="text-2xl font-bold font-mono" style={{ color: green }}>${categoryConsolidation.potentialSavings.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: textSecondary }}>Potential Annual Savings</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.03)', color: textSecondary }}>No consolidation data available</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
