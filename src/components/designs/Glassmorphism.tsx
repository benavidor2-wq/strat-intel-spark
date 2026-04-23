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
  type InertiaPoint = { period: string; committed: number; discretionary: number; total: number; committedShare: number; habit: string };
  type MatrixPoint = {
    id: string;
    name: string;
    vendor: string;
    project: string;
    volumeChange: number;
    priceChange: number;
    identifiedSavings: number;
    monthlySpend: number;
    lowestSupplier: string;
    anomaly: boolean;
    summary: string;
    cadence: string;
    category: string;
  };

  const [auditOpen, setAuditOpen] = useState(false);
  const [matrixMode, setMatrixMode] = useState<"vendor" | "project">("vendor");
  const [selectedHabit, setSelectedHabit] = useState<MatrixPoint | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(spendingTrends[spendingTrends.length - 1].period);

  const inertiaData: InertiaPoint[] = spendingTrends.map((trend, index) => {
    const committedShare = 0.58 + index * 0.018;
    const committed = Math.round(trend.costs * committedShare);
    const discretionary = trend.costs - committed;
    return {
      period: trend.period,
      committed,
      discretionary,
      total: trend.costs,
      committedShare: Math.round((committed / trend.costs) * 100),
      habit: index < 2 ? "seasonal expansion" : index === 2 ? "project ramp" : index === 3 ? "recurring base reset" : "fixed-cost normalization",
    };
  });

  const recurringVendors = [
    { vendor: "CloudLedger SaaS", burn: 38400, velocity: "+14%", cadence: "monthly", behavior: "seat-count creep", contract: "renews in 42 days" },
    { vendor: "Metro Facilities", burn: 31200, velocity: "+9%", cadence: "monthly", behavior: "facility baseline", contract: "auto-renewal active" },
    { vendor: "UtilityGrid", burn: 22100, velocity: "+7%", cadence: "monthly", behavior: "usage floor rising", contract: "indexed monthly" },
    { vendor: "SecureOps", burn: 18400, velocity: "+4%", cadence: "annualized monthly", behavior: "tooling dependency", contract: "seat expansion" },
    { vendor: "FleetFuel Direct", burn: 16700, velocity: "+18%", cadence: "weekly", behavior: "route intensity", contract: "usage-based floor" },
  ];

  const matrixPoints: MatrixPoint[] = [
    { id: "vendor-a", name: "Vendor A", vendor: "Vendor A", project: "Project Alpha", volumeChange: -6, priceChange: 24, identifiedSavings: 47500, monthlySpend: 86500, lowestSupplier: "Verified Supply Co.", anomaly: true, cadence: "ad hoc", category: "Specialty Materials", summary: "This habit is price-sensitive: fewer units were bought, but the unit cost rose sharply." },
    { id: "freight", name: "Northline Freight", vendor: "Northline Freight", project: "Logistics", volumeChange: 18, priceChange: 11, identifiedSavings: 22900, monthlySpend: 64200, lowestSupplier: "QuickHaul Preferred", anomaly: false, cadence: "weekly", category: "Logistics", summary: "This habit is scale-led: purchase frequency increased and pricing moved up moderately." },
    { id: "raw", name: "Raw Materials", vendor: "AlloyWorks", project: "Project Delta", volumeChange: 31, priceChange: -4, identifiedSavings: 11200, monthlySpend: 95000, lowestSupplier: "MetalWorks", anomaly: false, cadence: "biweekly", category: "Raw Materials", summary: "This habit is growth-led: the business bought more, while unit economics improved." },
    { id: "saas", name: "Seat Licenses", vendor: "CloudLedger SaaS", project: "Shared Services", volumeChange: 7, priceChange: 18, identifiedSavings: 26400, monthlySpend: 38400, lowestSupplier: "StackSuite", anomaly: true, cadence: "monthly", category: "Software", summary: "This habit is recurring-base creep: licenses expanded while renewal pricing increased." },
    { id: "marketing", name: "Marketing Dept", vendor: "MarketMakers", project: "Growth Sprint", volumeChange: -14, priceChange: -8, identifiedSavings: 6100, monthlySpend: 21000, lowestSupplier: "Current vendor", anomaly: false, cadence: "campaign", category: "Marketing", summary: "This habit is controlled contraction: scope reduced and unit costs improved." },
  ];

  const groupedMatrix = matrixMode === "vendor"
    ? matrixPoints
    : matrixPoints.map((point) => ({ ...point, name: point.project }));

  const currentPeriod = inertiaData.find((point) => point.period === selectedPeriod) ?? inertiaData[inertiaData.length - 1];
  const previousPeriod = inertiaData[Math.max(0, inertiaData.findIndex((point) => point.period === currentPeriod.period) - 1)] ?? inertiaData[0];
  const committedMoM = Math.round(((currentPeriod.committed - previousPeriod.committed) / previousPeriod.committed) * 100);
  const discretionaryMoM = Math.round(((currentPeriod.discretionary - previousPeriod.discretionary) / previousPeriod.discretionary) * 100);
  const totalHabitSpend = matrixPoints.reduce((total, point) => total + point.monthlySpend, 0);
  const fixedShare = currentPeriod.committedShare;
  const recurringBurn = recurringVendors.reduce((total, vendor) => total + vendor.burn, 0);
  const habitConnections = matrixPoints.filter((point) => point.category === "Software" || point.category === "Logistics" || point.category === "Raw Materials");

  const handleScatterClick = (payload: unknown) => {
    const point = payload && typeof payload === "object" && "payload" in payload ? (payload as { payload?: MatrixPoint }).payload : null;
    if (point) setSelectedHabit(point);
  };

  // CLAUDE_NOTE: Use 'Pillar D: Inventory Predictive Ordering' to calculate 'Velocity' and 'Burn Rates' for the Operational Inertia baseline.
  // CLAUDE_NOTE: Reference 'Pillar B: Price Drift' to plot the Y-axis of the Matrix; dot size should correspond to 'identified_savings'.
  // CLAUDE_NOTE: Use 'Semantic Dimension Discovery' to allow the user to toggle the Scatter Plot dots between 'By Vendor' and 'By Project Code'.
  // CLAUDE_NOTE: Ensure the 'executive_summary' in the JSON provides the plain-English 'Why' behind the Price-Volume variance.
  // CLAUDE_NOTE: Map 'risk_alerts' to the Scatter Plot as red halo rings around dots with forensic anomalies.

  return (
    <div className={`${glass} p-6`}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><TrendingDown size={14} className="text-finance-indigo" /> Spending Habits Diagnostic</h3>
          <p className="mt-1 text-xs text-muted-foreground">Connect recurring baseline behavior with purchase volume, cadence, and unit-price habits.</p>
        </div>
        <div className="rounded-full border border-finance-indigo/15 bg-card/70 px-4 py-2 text-xs font-semibold text-finance-indigo">Selected period: {currentPeriod.period}</div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <button onClick={() => setAuditOpen(true)} className="rounded-2xl bg-muted/50 p-4 text-left transition hover:bg-muted">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recurring Floor</div>
          <div className="mt-2 font-mono text-2xl font-bold text-foreground">{fixedShare}%</div>
          <div className="mt-1 text-xs text-muted-foreground">of {currentPeriod.period} spend is committed</div>
        </button>
        <div className="rounded-2xl bg-muted/50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Committed Change</div>
          <div className="mt-2 font-mono text-2xl font-bold text-finance-indigo">{committedMoM > 0 ? "+" : ""}{committedMoM}%</div>
          <div className="mt-1 text-xs text-muted-foreground">vs previous period, verified from fixed layer</div>
        </div>
        <div className="rounded-2xl bg-muted/50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Variable Change</div>
          <div className="mt-2 font-mono text-2xl font-bold text-risk-high">{discretionaryMoM > 0 ? "+" : ""}{discretionaryMoM}%</div>
          <div className="mt-1 text-xs text-muted-foreground">project and one-off purchase motion</div>
        </div>
        <div className="rounded-2xl bg-muted/50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mapped Habits</div>
          <div className="mt-2 font-mono text-2xl font-bold text-foreground">${(totalHabitSpend / 1000).toFixed(0)}K</div>
          <div className="mt-1 text-xs text-muted-foreground">across matrix dimensions</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Operational Inertia Map</div>
              <p className="mt-1 text-xs text-muted-foreground">Stacked area chart: the dark base is recurring spend, the lighter layer is flexible project spend. Click any period to update the readout.</p>
            </div>
            <button onClick={() => setAuditOpen(true)} className="rounded-full bg-finance-indigo px-3 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-finance-indigo/20">Drill Down</button>
          </div>
          <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2">
            <button onClick={() => setAuditOpen(true)} className="rounded-xl border border-finance-indigo/15 bg-finance-indigo/10 p-3 text-left transition hover:bg-finance-indigo/15">
              <div className="flex items-center gap-2 font-semibold text-foreground"><span className="h-3 w-3 rounded-sm bg-finance-indigo" /> Committed / Fixed</div>
              <div className="mt-1 text-muted-foreground">Predictable vendors: rent, utilities, SaaS, recurring services.</div>
            </button>
            <div className="rounded-xl border border-finance-indigo/10 bg-finance-indigo-soft/20 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground"><span className="h-3 w-3 rounded-sm bg-finance-indigo-soft" /> Discretionary / Variable</div>
              <div className="mt-1 text-muted-foreground">One-off or project-based invoices that move with operating activity.</div>
            </div>
          </div>
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inertiaData} margin={{ top: 18, right: 14, left: 0, bottom: 4 }} onClick={(event) => { if (event?.activeLabel) setSelectedPeriod(String(event.activeLabel)); if (event?.activePayload?.some((item) => item.dataKey === "committed")) setAuditOpen(true); }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <RechartsTooltip
                  formatter={(value: number, name: string) => {
                    const label = String(name).toLowerCase().includes("committed") ? "Committed / Fixed spend" : "Discretionary / Variable spend";
                    return [`$${value.toLocaleString()}`, label];
                  }}
                  labelFormatter={(label) => {
                    const point = inertiaData.find((item) => item.period === label);
                    return point ? `${point.period} spending habit: ${point.habit}` : String(label);
                  }}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="committed" stackId="spend" stroke="hsl(var(--finance-indigo))" fill="hsl(var(--finance-indigo))" fillOpacity={0.88} name="Committed / Fixed" activeDot={{ r: 6, stroke: "hsl(var(--card))", strokeWidth: 2, onClick: () => setAuditOpen(true) }} />
                <Area type="monotone" dataKey="discretionary" stackId="spend" stroke="hsl(var(--finance-indigo-soft))" fill="hsl(var(--finance-indigo-soft))" fillOpacity={0.64} name="Discretionary / Variable" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">Selected fixed layer</span><div className="font-mono font-semibold text-finance-indigo">${currentPeriod.committed.toLocaleString()} · {currentPeriod.committedShare}%</div></div>
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">Selected variable layer</span><div className="font-mono font-semibold text-foreground">${currentPeriod.discretionary.toLocaleString()} · {100 - currentPeriod.committedShare}%</div></div>
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">What changed</span><div className="font-semibold text-foreground">{currentPeriod.habit}</div></div>
          </div>
        </section>

        <section className="rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Price-Volume-Mix Matrix</div>
              <p className="mt-1 text-xs text-muted-foreground">Each dot is a vendor or project. Left/right shows quantity change, up/down shows unit-price change, and dot size shows spend weight.</p>
            </div>
            <div className="flex rounded-full bg-muted p-1 text-xs font-semibold">
              {(["vendor", "project"] as const).map((mode) => (
                <button key={mode} onClick={() => setMatrixMode(mode)} className={`rounded-full px-3 py-1.5 capitalize transition ${matrixMode === mode ? "bg-card text-finance-indigo shadow-sm" : "text-muted-foreground"}`}>{mode}</button>
              ))}
            </div>
          </div>
          <div className="relative h-[330px]">
            <div className="pointer-events-none absolute right-6 top-4 z-10 rounded-lg bg-card/80 px-2 py-1 text-[10px] font-semibold text-risk-high">Price-led habits</div>
            <div className="pointer-events-none absolute bottom-8 right-6 z-10 rounded-lg bg-card/80 px-2 py-1 text-[10px] font-semibold text-finance-indigo">Scale-led habits</div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 18, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="volumeChange" name="Volume Change" domain={[-20, 36]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} label={{ value: "% Change in Volume", position: "insideBottom", offset: -6, fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="number" dataKey="priceChange" name="Unit Price Change" domain={[-12, 28]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} label={{ value: "% Change in Unit Price", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <ZAxis type="number" dataKey="monthlySpend" range={[120, 660]} />
                <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: number, name: string) => [name === "monthlySpend" ? `$${value.toLocaleString()}` : `${value}%`, name]} contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }} />
                <Scatter data={groupedMatrix} onClick={handleScatterClick}>
                  {groupedMatrix.map((point) => (
                    <Cell key={point.id} fill={point.priceChange > 12 ? "hsl(var(--risk-high))" : point.volumeChange > 20 ? "hsl(var(--finance-indigo))" : "hsl(var(--finance-indigo-soft))"} stroke={point.anomaly ? "hsl(var(--destructive))" : "hsl(var(--card))"} strokeWidth={point.anomaly ? 4 : 2} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">Dot color</span><div className="font-semibold text-foreground">Amber = price-led · Indigo = volume-led</div></div>
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">Dot size</span><div className="font-semibold text-foreground">Larger = more monthly spend</div></div>
            <div className="rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">Red ring</span><div className="font-semibold text-foreground">Forensic anomaly attached</div></div>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {habitConnections.map((point) => <button key={point.id} onClick={() => setSelectedHabit(point)} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-left transition hover:bg-muted"><span>{point.name}</span><span className="font-mono text-foreground">{point.cadence}</span></button>)}
          </div>
        </section>
      </div>

      <div className="mt-5 rounded-2xl border border-finance-indigo/15 bg-card/70 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Connected Habit Path</div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          <div className="rounded-xl bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Baseline</div><div className="font-semibold text-foreground">{fixedShare}% fixed in {currentPeriod.period}</div></div>
          <div className="hidden h-px bg-finance-indigo/30 md:block" />
          <div className="rounded-xl bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Behavior</div><div className="font-semibold text-foreground">{currentPeriod.habit}</div></div>
          <div className="hidden h-px bg-finance-indigo/30 md:block" />
          <button onClick={() => setSelectedHabit(groupedMatrix[0])} className="rounded-xl bg-finance-indigo/10 p-3 text-left transition hover:bg-finance-indigo/15"><div className="text-xs text-muted-foreground">Matrix pivot</div><div className="font-semibold text-finance-indigo">Open related vendor/project dots</div></button>
        </div>
      </div>

      <AnimatePresence>
        {auditOpen && (
          <motion.aside initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed bottom-6 right-6 top-6 z-50 w-[410px] max-w-[calc(100vw-3rem)] overflow-y-auto rounded-2xl border border-finance-indigo/15 bg-card p-5 text-card-foreground shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Habit Drilldown</div><h4 className="mt-1 text-base font-semibold">Recurring spend audit</h4><p className="mt-1 text-xs text-muted-foreground">Verified fixed layer: ${currentPeriod.committed.toLocaleString()} · recurring burn: ${recurringBurn.toLocaleString()}</p></div>
              <button onClick={() => setAuditOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {recurringVendors.map((vendor, index) => (
                <button key={vendor.vendor} onClick={() => setSelectedHabit(matrixPoints.find((point) => point.vendor === vendor.vendor) ?? matrixPoints[3])} className="w-full rounded-xl bg-muted/50 p-3 text-left transition hover:bg-muted">
                  <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-foreground">{index + 1}. {vendor.vendor}</span><span className="font-mono text-sm font-bold text-finance-indigo">${vendor.burn.toLocaleString()}</span></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{vendor.cadence} · {vendor.behavior}</span><span className="font-mono text-risk-high">{vendor.velocity}</span></div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{vendor.contract}</div>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHabit && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] grid place-items-center bg-foreground/30 p-6" onClick={() => setSelectedHabit(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="w-full max-w-xl rounded-2xl border border-finance-indigo/20 bg-card p-6 text-card-foreground shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-start justify-between gap-4"><div><div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Spending Habit Detail</div><h4 className="mt-1 text-lg font-semibold">{selectedHabit.name}</h4></div><button onClick={() => setSelectedHabit(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={16} /></button></div>
              <p className="text-sm leading-relaxed text-muted-foreground">{selectedHabit.summary}</p>
              <div className="my-5 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-muted/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Spend</div><div className="mt-1 font-mono text-xl font-bold text-foreground">${(selectedHabit.monthlySpend / 1000).toFixed(0)}K</div></div><div className="rounded-xl bg-muted/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Volume</div><div className="mt-1 font-mono text-xl font-bold text-finance-indigo">{selectedHabit.volumeChange > 0 ? "+" : ""}{selectedHabit.volumeChange}%</div></div><div className="rounded-xl bg-muted/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Unit Price</div><div className="mt-1 font-mono text-xl font-bold text-risk-high">{selectedHabit.priceChange > 0 ? "+" : ""}{selectedHabit.priceChange}%</div></div><div className="rounded-xl bg-muted/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cadence</div><div className="mt-1 text-sm font-bold text-foreground">{selectedHabit.cadence}</div></div></div>
              <div className="rounded-xl bg-finance-indigo/10 p-4 text-sm text-foreground">Connection: <span className="font-semibold text-finance-indigo">{selectedHabit.category}</span> contributes to the {currentPeriod.habit} pattern in {currentPeriod.period}. Benchmark supplier: <span className="font-semibold">{selectedHabit.lowestSupplier}</span>.</div>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground">Vendor</span><div className="font-semibold text-foreground">{selectedHabit.vendor}</div></div><div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground">Project Code</span><div className="font-semibold text-foreground">{selectedHabit.project}</div></div></div>
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
  const totalExposure = integrityAlerts.reduce((sum, alert) => sum + alert.amount, 0);
  const criticalCount = integrityAlerts.filter((a) => a.severity === "critical").length;
  const highCount = integrityAlerts.filter((a) => a.severity === "high").length;
  const latestDetection = integrityAlerts.map((alert) => alert.date).sort().at(-1);

  return (
    <div className="grid gap-5">
      <section className={`${glass} p-6`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Shield size={18} className="text-risk-critical" /> Anomaly & Risk</h3>
            <p className="mt-1 text-sm text-muted-foreground">AI-detected invoice, vendor, and payment integrity risks.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricTile label="Flagged Exposure" value={`$${totalExposure.toLocaleString()}`} tone="critical" />
          <MetricTile label="Critical" value={criticalCount} tone="critical" />
          <MetricTile label="High Risk" value={highCount} tone="high" />
          <MetricTile label="Total Alerts" value={integrityAlerts.length} tone="medium" />
          <MetricTile label="Latest Detection" value={latestDetection ?? "—"} tone="cookie" />
        </div>
      </section>

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
