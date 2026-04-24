import { type MouseEvent, type ReactNode, useState } from "react";
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
  type IntegrityAlert,
  type PriceDriftItem,
} from "@/data/mockData";
import { ArrowLeft, Shield, TrendingDown, Zap, Users, Gift, Send, X, FileText, CheckCircle2, CalendarDays } from "lucide-react";
import { XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";

const purple = "hsl(239 84% 67%)";
const green = "hsl(142 71% 45%)";
const warn = "hsl(38 92% 50%)";
const danger = "hsl(0 84% 60%)";
const textPrimary = "hsl(246 47% 20%)";
const textSecondary = "hsl(220 9% 46%)";

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
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const togglePopover = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 288;
    const left = Math.min(rect.left, window.innerWidth - popoverWidth - 16);
    const nextPosition = {
      top: rect.bottom + 8,
      left: Math.max(16, left),
    };

    setPopoverPosition(nextPosition);
    setOpen((current) => !current);
  };

  return (
    <div className="relative">
      <button
        onClick={togglePopover}
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
            {createPortal(
              <>
                <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="fixed z-[1001] w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl"
                  style={{ top: popoverPosition.top, left: popoverPosition.left }}
                  data-parsed-invoice-popover="invoiceNo invoiceDate total"
                >
                  {/* Claude breadcrumb: parsed invoice data should map at minimum to invoiceNo, invoiceDate, and total amount. */}
                  <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Invoice</div>
                      <div className="text-sm font-semibold text-foreground">{vendor.name}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Invoice #</span>
                      <span className="break-all text-right font-mono font-semibold text-foreground">{vendor.invoiceNo}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-mono font-semibold text-foreground">{vendor.invoiceDate}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-mono font-semibold text-foreground">${vendor.total.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-mono font-semibold text-foreground">${vendor.price}</span>
                    </div>
                  </div>
                </motion.div>
              </>,
              document.body,
            )}
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

function PriceDriftInvoicePanel({ item, onClose }: { item: PriceDriftItem; onClose: () => void }) {
  return (
    <div className="my-3 flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
      <div className="flex items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: textPrimary }}>{item.product}</h3>
          <p className="text-xs mt-1" style={{ color: textSecondary }}>Vendor: {item.vendor} · Drift: <span className="font-mono font-semibold" style={{ color: item.status === "alert" ? danger : item.status === "warning" ? warn : green }}>+{item.driftPercent}%</span></p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-all">
          <X size={16} style={{ color: textSecondary }} />
        </button>
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-4 flex items-center gap-2"><FileText size={14} className="text-destructive" /><span className="text-xs font-semibold uppercase tracking-wider text-destructive">Most Recent Invoice</span></div>
          <div className="space-y-4 text-xs">
            <div><div className="uppercase tracking-wider text-[10px] text-muted-foreground">Invoice #</div><div className="mt-0.5 font-mono font-semibold text-foreground">{item.recentInvoice.invoiceNo}</div></div>
            <div><div className="uppercase tracking-wider text-[10px] text-muted-foreground">Date</div><div className="mt-0.5 font-mono text-foreground">{item.recentInvoice.date}</div></div>
            <div><div className="uppercase tracking-wider text-[10px] text-muted-foreground">Unit Price</div><div className="mt-0.5 font-mono text-2xl font-bold text-destructive">${item.recentInvoice.unitPrice}</div></div>
            <div><div className="uppercase tracking-wider text-[10px] text-muted-foreground">Qty / Total</div><div className="mt-0.5 font-mono font-semibold text-foreground">{item.recentInvoice.qty} units · ${item.recentInvoice.total.toLocaleString()}</div></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-4 flex items-center gap-2"><FileText size={14} className="text-primary" /><span className="text-xs font-semibold uppercase tracking-wider text-primary">Previous 90-Day Invoices</span></div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.2fr] bg-muted px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><div>Invoice #</div><div>Date</div><div className="text-right">Unit Price</div><div className="text-right">Qty / Total</div></div>
            {item.historicalInvoices.map((inv, i) => <div key={i} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.2fr] border-t border-border px-3 py-3 text-xs"><div className="font-mono font-semibold text-foreground">{inv.invoiceNo}</div><div className="font-mono text-muted-foreground">{inv.date}</div><div className="text-right font-mono font-bold text-foreground">${inv.unitPrice}</div><div className="text-right font-mono text-muted-foreground">{inv.qty} units · ${inv.total.toLocaleString()}</div></div>)}
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs lg:col-span-2"><span className="text-muted-foreground">Price increased from </span><span className="font-mono font-bold text-foreground">${item.historicalInvoices[item.historicalInvoices.length - 1]?.unitPrice}</span><span className="text-muted-foreground"> to </span><span className="font-mono font-bold text-destructive">${item.recentInvoice.unitPrice}</span><span className="text-muted-foreground"> over the past 90 days — use these invoices to negotiate back to previous rates.</span></div>
      </div>
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
                <>
                  <tr key={item.id} className="border-b border-gray-100/50 cursor-pointer transition-all hover:bg-white/60" onClick={() => setSelectedItem((current) => current?.id === item.id ? null : item)}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: textPrimary }}>{item.product}</td>
                    <td className="px-5 py-3.5" style={{ color: textSecondary }}>{item.vendor}</td>
                    <td className="px-5 py-3.5 text-right font-mono">${item.currentPrice}</td>
                    <td className="px-5 py-3.5 text-right font-mono" style={{ color: textSecondary }}>${item.avg90Day}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold" style={{ color: statusColor }}>+{item.driftPercent}%</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>{item.status}</span>
                    </td>
                  </tr>
                  {selectedItem?.id === item.id && (
                    <tr key={`${item.id}-details`}>
                      <td colSpan={6} className="p-0">
                        <PriceDriftInvoicePanel item={item} onClose={() => setSelectedItem(null)} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}


function SpendingReport() {
  // CLAUDE_NOTE: Use the 'Integrity Layer' to flag bubbles with active 'risk_alerts' using a red pulse animation.
  // CLAUDE_NOTE: Map the 'Lazy Tax' from the 'Arbitrage' pillar to calculate the size of the 'Waste' layer in the Efficiency Ring.
  // CLAUDE_NOTE: Reference 'Pillar E: Spending Patterns' to define the size of bubbles based on MoM/QoQ growth variance.
  // CLAUDE_NOTE: Use 'suggested_viz' logic to automatically highlight the bubble with the single largest savings opportunity.

  type Bubble = {
    id: string;
    vendor: string;
    category: string;
    spend: number;
    efficiency: number; // 0-100 (higher = more efficient)
    bucket: "growth" | "base" | "leakage";
    why: string;
    topVendors: { name: string; spend: number }[];
    identifiedSavings: number;
    fixAction: string;
    riskAlert: boolean;
  };

  const bubbles: Bubble[] = [
    { id: "vendor-a", vendor: "Vendor A", category: "Specialty Materials", spend: 86500, efficiency: 18, bucket: "leakage", why: "Spend is up because of a 24% unit-price hike by Vendor A while order volume actually fell 6%.", topVendors: [{ name: "Vendor A", spend: 86500 }, { name: "Verified Supply Co.", spend: 12200 }, { name: "MetroParts", spend: 8100 }], identifiedSavings: 47500, fixAction: "Switch to Verified Supply Co.", riskAlert: true },
    { id: "saas", vendor: "CloudLedger SaaS", category: "Software", spend: 38400, efficiency: 28, bucket: "leakage", why: "Seat-count creep + 18% renewal price increase. Lazy tax on auto-renewal.", topVendors: [{ name: "CloudLedger SaaS", spend: 38400 }, { name: "StackSuite", spend: 9600 }, { name: "LedgerLite", spend: 4200 }], identifiedSavings: 26400, fixAction: "Consolidate to StackSuite", riskAlert: true },
    { id: "freight", vendor: "Northline Freight", category: "Logistics", spend: 64200, efficiency: 55, bucket: "growth", why: "Shipment frequency up 18% to support scaling; pricing only up 11%.", topVendors: [{ name: "Northline Freight", spend: 64200 }, { name: "QuickHaul Preferred", spend: 14800 }, { name: "RegionRoute", spend: 6300 }], identifiedSavings: 22900, fixAction: "Negotiate volume tier with QuickHaul", riskAlert: false },
    { id: "raw", vendor: "AlloyWorks", category: "Raw Materials", spend: 95000, efficiency: 82, bucket: "growth", why: "Volume up 31% to fuel production; unit cost actually dropped 4%.", topVendors: [{ name: "AlloyWorks", spend: 95000 }, { name: "MetalWorks", spend: 18200 }, { name: "CoreSteel", spend: 7400 }], identifiedSavings: 11200, fixAction: "Lock in 12-month rate card", riskAlert: false },
    { id: "facilities", vendor: "Metro Facilities", category: "Facilities", spend: 31200, efficiency: 62, bucket: "base", why: "Steady recurring baseline. Up 9% vs prior period in line with footprint.", topVendors: [{ name: "Metro Facilities", spend: 31200 }, { name: "BuildOps", spend: 6100 }, { name: "SiteCare", spend: 3200 }], identifiedSavings: 4200, fixAction: "Benchmark against BuildOps", riskAlert: false },
    { id: "utility", vendor: "UtilityGrid", category: "Utilities", spend: 22100, efficiency: 70, bucket: "base", why: "Indexed monthly contract. Recurring inertia, low volatility.", topVendors: [{ name: "UtilityGrid", spend: 22100 }, { name: "PowerPool", spend: 4800 }, { name: "GridDirect", spend: 2100 }], identifiedSavings: 1800, fixAction: "Audit usage floor", riskAlert: false },
    { id: "marketing", vendor: "MarketMakers", category: "Marketing", spend: 21000, efficiency: 74, bucket: "base", why: "Controlled contraction: scope reduced 14%, unit cost improved 8%.", topVendors: [{ name: "MarketMakers", spend: 21000 }, { name: "BrandLab", spend: 5400 }, { name: "GrowthForge", spend: 2800 }], identifiedSavings: 6100, fixAction: "Hold current vendor", riskAlert: false },
  ];

  // CLAUDE_NOTE: 'suggested_viz' — auto-highlight the single largest savings opportunity
  const heroBubble = [...bubbles].sort((a, b) => b.identifiedSavings - a.identifiedSavings)[0];
  const totalSpend = bubbles.reduce((s, b) => s + b.spend, 0);
  const growthSpend = bubbles.filter((b) => b.bucket === "growth").reduce((s, b) => s + b.spend, 0);
  const baseSpend = bubbles.filter((b) => b.bucket === "base").reduce((s, b) => s + b.spend, 0);
  const leakageSpend = bubbles.filter((b) => b.bucket === "leakage").reduce((s, b) => s + b.spend, 0);
  const totalSavings = bubbles.reduce((s, b) => s + b.identifiedSavings, 0);

  const ringData = [
    { name: "Growth Spend", value: growthSpend, fill: "hsl(var(--finance-emerald))", desc: "Increased volume to fuel scaling" },
    { name: "Base Spend", value: baseSpend, fill: "hsl(var(--finance-indigo))", desc: "Recurring operational inertia" },
    { name: "Leakage", value: leakageSpend, fill: "hsl(var(--destructive))", desc: "Price drift & lazy tax" },
  ];

  const [selected, setSelected] = useState<Bubble | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const efficiencyColor = (eff: number) => {
    if (eff >= 60) return "hsl(var(--finance-emerald))";
    if (eff >= 40) return "hsl(var(--finance-indigo))";
    return "hsl(var(--destructive))";
  };

  // Layout the bubbles in a tidy grid-on-canvas (size = spend)
  const minR = 32;
  const maxR = 78;
  const spendMin = Math.min(...bubbles.map((b) => b.spend));
  const spendMax = Math.max(...bubbles.map((b) => b.spend));
  const radius = (spend: number) => minR + ((spend - spendMin) / (spendMax - spendMin)) * (maxR - minR);

  // Pre-computed positions (% of canvas) — clusters by bucket
  const positions: Record<string, { x: number; y: number }> = {
    "vendor-a": { x: 22, y: 32 },
    saas: { x: 38, y: 62 },
    freight: { x: 56, y: 30 },
    raw: { x: 78, y: 50 },
    facilities: { x: 16, y: 74 },
    utility: { x: 50, y: 82 },
    marketing: { x: 78, y: 78 },
  };

  return (
    <div className={`${glass} p-6`}>
      {/* ZONE 1: AI Narrative — Executive BLUF */}
      <section className="mb-6 rounded-2xl border border-finance-indigo/15 bg-card/70 p-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">
          <Zap size={12} /> Executive pulse
        </div>
        <p className="text-2xl font-semibold leading-snug tracking-tight text-finance-indigo md:text-3xl">
          Your spend is healthy on growth, but{" "}
          <span className="text-destructive">${(leakageSpend / 1000).toFixed(0)}K of monthly leakage</span>{" "}
          across {bubbles.filter((b) => b.bucket === "leakage").length} vendors is hiding{" "}
          <span className="rounded-md bg-finance-emerald/15 px-2 py-0.5 text-finance-emerald">
            ${(totalSavings / 1000).toFixed(0)}K in identified savings
          </span>
          . Start with <span className="text-finance-indigo">{heroBubble.vendor}</span>.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* ZONE 2: Efficiency Ring */}
        <section className="rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Efficiency Ring</div>
          <p className="mb-3 text-xs text-muted-foreground">How every dollar of monthly spend is behaving.</p>
          <div className="relative h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ringData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={78} outerRadius={120} paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={3}>
                  {ringData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <RechartsTooltip formatter={(v: number, n: string) => [`$${v.toLocaleString()} (${((v / totalSpend) * 100).toFixed(0)}%)`, n]} contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total monthly</div>
              <div className="font-mono text-2xl font-bold text-foreground">${(totalSpend / 1000).toFixed(0)}K</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {ringData.map((d) => (
              <div key={d.name} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: d.fill }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>{d.name}</span>
                    <span className="font-mono">{((d.value / totalSpend) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ZONE 3: Discovery Bubble Map */}
        <section className="rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Discovery Map</div>
              <p className="mt-1 text-xs text-muted-foreground">Bubble <strong>size</strong> = monthly spend. Bubble <strong>color</strong> = efficiency score (emerald = healthy, red = price drift). Click any bubble to drill down.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-finance-emerald" /> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-finance-indigo" /> Mid</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Drift</span>
            </div>
          </div>

          <div className="relative mt-3 h-[440px] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 via-card/60 to-muted/30">
            {bubbles.map((b) => {
              const pos = positions[b.id];
              const r = radius(b.spend);
              const isHero = b.id === heroBubble.id;
              const isHover = hoveredId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  onMouseEnter={() => setHoveredId(b.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-finance-indigo ${b.riskAlert ? "animate-risk-pulse" : ""}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: r * 2,
                    height: r * 2,
                    background: `radial-gradient(circle at 30% 30%, ${efficiencyColor(b.efficiency)}ee, ${efficiencyColor(b.efficiency)}aa)`,
                    boxShadow: isHero ? `0 0 0 3px hsl(var(--card)), 0 0 0 5px ${efficiencyColor(b.efficiency)}, 0 12px 28px -8px ${efficiencyColor(b.efficiency)}` : `0 8px 22px -8px ${efficiencyColor(b.efficiency)}`,
                  }}
                >
                  <span className="pointer-events-none flex h-full w-full flex-col items-center justify-center px-2 text-center text-primary-foreground">
                    <span className="text-[11px] font-bold leading-tight drop-shadow">{b.vendor}</span>
                    <span className="font-mono text-[10px] opacity-90">${(b.spend / 1000).toFixed(0)}K</span>
                  </span>
                  {isHero && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-finance-emerald px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
                      Top opportunity
                    </span>
                  )}
                  {isHover && (
                    <div className="absolute left-1/2 top-full z-20 mt-3 w-64 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 text-left text-popover-foreground shadow-xl">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Why</div>
                      <p className="mt-1 text-xs leading-relaxed">{b.why}</p>
                      {b.bucket === "leakage" && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Savings</span>
                          <span className="font-mono font-bold text-finance-emerald">${b.identifiedSavings.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* DRILL-DOWN MODAL — Semantic Pivot */}
      <AnimatePresence>
        {selected && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] grid place-items-center bg-foreground/30 p-6" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="w-full max-w-xl rounded-2xl border border-finance-indigo/20 bg-card p-6 text-card-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">
                    <span className="h-2 w-2 rounded-full" style={{ background: efficiencyColor(selected.efficiency) }} />
                    {selected.category}
                  </div>
                  <h4 className="mt-1 text-lg font-semibold">{selected.vendor}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{selected.why}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={16} /></button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Monthly spend</div>
                  <div className="mt-1 font-mono text-xl font-bold text-foreground">${(selected.spend / 1000).toFixed(0)}K</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Efficiency</div>
                  <div className="mt-1 font-mono text-xl font-bold" style={{ color: efficiencyColor(selected.efficiency) }}>{selected.efficiency}/100</div>
                </div>
                <div className="rounded-xl bg-finance-emerald/10 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-finance-emerald">Savings</div>
                  <div className="mt-1 font-mono text-xl font-bold text-finance-emerald">${(selected.identifiedSavings / 1000).toFixed(0)}K</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Top 3 vendors in this bucket</div>
                <div className="space-y-2">
                  {selected.topVendors.map((v, i) => (
                    <div key={v.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span className="font-semibold text-foreground">{i + 1}. {v.name}</span>
                      <span className="font-mono text-foreground">${v.spend.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.bucket === "leakage" && (
                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/30 transition hover:opacity-90">
                  <Zap size={14} /> Fix Now — {selected.fixAction}
                </button>
              )}
              {selected.bucket !== "leakage" && (
                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-finance-indigo px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-finance-indigo/20 transition hover:opacity-90">
                  <CheckCircle2 size={14} /> {selected.fixAction}
                </button>
              )}
            </motion.div>
          </motion.div>,
          document.body,
        )}
      </AnimatePresence>
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

type SeverityFilter = "all" | IntegrityAlert["severity"];

const severityFilters: { label: string; value: SeverityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
];

function getSeverityStyles(severity: IntegrityAlert["severity"]) {
  if (severity === "critical") return "border-risk-critical/25 bg-risk-critical/10 text-risk-critical";
  if (severity === "high") return "border-risk-high/25 bg-risk-high/10 text-risk-high";
  return "border-risk-medium/25 bg-risk-medium/10 text-risk-medium";
}

function getAnomalyLabel(type: IntegrityAlert["type"]) {
  return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function getRiskExplanation(type: IntegrityAlert["type"]) {
  const explanations: Record<IntegrityAlert["type"], string> = {
    phantom_vendor: "The vendor has invoice activity without matching receipt or delivery evidence, which can indicate fabricated supplier spend.",
    duplicate_invoice: "The invoice pattern resembles a previously submitted payment request and should be blocked until AP confirms uniqueness.",
    split_invoice: "Multiple invoices are clustered below an approval threshold, suggesting the purchase may have been split to bypass controls.",
    mandate_fraud: "Payment details changed shortly before settlement, creating a high-risk payment redirection scenario.",
  };
  return explanations[type];
}

function getRecommendedAction(type: IntegrityAlert["type"]) {
  const actions: Record<IntegrityAlert["type"], string> = {
    phantom_vendor: "Pause payment and verify vendor legitimacy against procurement, receiving, and master-data records.",
    duplicate_invoice: "Hold the invoice, compare source documents, and require AP approval before release.",
    split_invoice: "Review the related purchase orders as a single bundle and escalate approval if thresholds were avoided.",
    mandate_fraud: "Freeze the payment and confirm bank-detail changes through a known vendor contact path.",
  };
  return actions[type];
}

function getEvidenceItems(alert: IntegrityAlert) {
  const shared = [`${alert.vendor} flagged on ${alert.date}`, `$${alert.amount.toLocaleString()} exposed`, "Control review required before payment release"];
  const evidence: Record<IntegrityAlert["type"], string[]> = {
    phantom_vendor: ["No delivery records matched to repeated invoices", "Vendor activity lacks receiving confirmation", ...shared],
    duplicate_invoice: ["Invoice identifier or payment pattern appears more than once", "Potential duplicated AP submission detected", ...shared],
    split_invoice: ["Invoice amounts cluster just below approval limits", "Pattern suggests approval-threshold avoidance", ...shared],
    mandate_fraud: ["Bank details changed close to scheduled payment", "Payment redirection risk exceeds tolerance", ...shared],
  };
  return evidence[alert.type];
}

function getBackendHandoffSteps(alert: IntegrityAlert) {
  // Claude backend cookie: persist these steps as investigation_events tied to anomaly_id for auditability.
  return [
    `${getAnomalyLabel(alert.type)} pattern detected`,
    "Vendor and invoice behavior checked",
    "Approval and payment controls reviewed",
    "Recommended action generated",
  ];
}

function IntegrityReport() {
  const [selectedAlertId, setSelectedAlertId] = useState(integrityAlerts[0]?.id);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const filteredAlerts = severityFilter === "all" ? integrityAlerts : integrityAlerts.filter((alert) => alert.severity === severityFilter);
  const selectedAlert = integrityAlerts.find((alert) => alert.id === selectedAlertId) ?? filteredAlerts[0] ?? integrityAlerts[0];
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.4fr]">
        <section className={`${glass} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Risk Queue</h4>
              <p className="text-xs text-muted-foreground">Prioritized anomaly cases for investigation.</p>
            </div>
            <Shield size={18} className="text-risk-critical" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {severityFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSeverityFilter(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${severityFilter === filter.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredAlerts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No risks match this filter.</div>
            ) : filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${isSelected ? "border-primary bg-card shadow-lg shadow-primary/10" : "border-border bg-card/70 hover:border-primary/30 hover:bg-card"}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSeverityStyles(alert.severity)}`}>{alert.severity}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{getAnomalyLabel(alert.type)}</span>
                      </div>
                      <h5 className="truncate text-sm font-semibold text-foreground">{alert.vendor}</h5>
                    </div>
                    <span className={`font-mono text-sm font-bold ${alert.severity === "critical" ? "text-risk-critical" : alert.severity === "high" ? "text-risk-high" : "text-risk-medium"}`}>${alert.amount.toLocaleString()}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{alert.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarDays size={12} /> Detected: {alert.date}</div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedAlert && (
          <section className={`${glass} overflow-hidden bg-card/95`}>
            <div className="border-b border-border px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getSeverityStyles(selectedAlert.severity)}`}>{selectedAlert.severity}</span>
                  </div>
                  <h4 className="text-xl font-semibold text-foreground">{selectedAlert.vendor}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{getAnomalyLabel(selectedAlert.type)} · detected {selectedAlert.date}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Risk Amount</div>
                  <div className="font-mono text-2xl font-bold text-risk-critical">${selectedAlert.amount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <InfoBlock title="Why it was flagged" icon={<Shield size={15} className="text-risk-critical" />}>{getRiskExplanation(selectedAlert.type)}</InfoBlock>
                <InfoBlock title="Evidence checklist" icon={<CheckCircle2 size={15} className="text-risk-success" />}>
                  <ul className="space-y-2">
                    {getEvidenceItems(selectedAlert).map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-foreground"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-success" />{item}</li>
                    ))}
                  </ul>
                </InfoBlock>
              </div>

              <div className="space-y-5">
                <InfoBlock title="Investigation trail" icon={<FileText size={15} className="text-primary" />}>
                  <div className="space-y-3">
                    {getBackendHandoffSteps(selectedAlert).map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground">{index + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </InfoBlock>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value, tone }: { label: string; value: string | number; tone: "critical" | "high" | "medium" | "cookie" }) {
  const toneClass = tone === "critical" ? "text-risk-critical bg-risk-critical/10 border-risk-critical/20" : tone === "high" ? "text-risk-high bg-risk-high/10 border-risk-high/20" : tone === "medium" ? "text-risk-medium bg-risk-medium/10 border-risk-medium/20" : "text-foreground bg-muted border-border";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold">{value}</div>
    </div>
  );
}

function InfoBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{icon}{title}</div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}
