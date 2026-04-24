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
import { ArrowLeft, Shield, TrendingDown, Zap, Users, Gift, Send, X, FileText, CheckCircle2, CalendarDays, Filter, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, ScatterChart, Scatter, ZAxis, ReferenceLine, BarChart as RechartsBarChart, Bar as RechartsBar, LabelList } from "recharts";

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
  // CLAUDE_NOTE: Pillar B Price Drift → drives the Waste segment math (unit-price delta × this-month qty).
  // CLAUDE_NOTE: Pillar C Lazy Tax → powers the drawer "Find arbitrage alternatives" CTA.
  // CLAUDE_NOTE: Pillar A Integrity alerts → red pulse animation on quadrant dots.
  // CLAUDE_NOTE: Pillar E recurring-pattern detector → drives Zone 4 Row A (Operational Inertia).

  type Commodity = {
    id: string;
    product: string;
    vendor: string;
    lastMonthQty: number;
    thisMonthQty: number;
    lastUnitPrice: number;
    thisUnitPrice: number;
    baseline90d: number;
    isRecurring: boolean;
    cadence?: "weekly" | "monthly" | "quarterly";
    riskAlert: boolean;
    priceHistory: number[]; // last 4 unit prices, oldest → newest
  };

  const commodities: Commodity[] = [
    { id: "copper-wire", product: "Copper Wire (kg)", vendor: "MetalWorks", lastMonthQty: 450, thisMonthQty: 500, lastUnitPrice: 10.5, thisUnitPrice: 11.8, baseline90d: 10.2, isRecurring: true, cadence: "monthly", riskAlert: true, priceHistory: [9.9, 10.1, 10.5, 11.8] },
    { id: "diesel", product: "Diesel Fuel (L)", vendor: "FuelDirect", lastMonthQty: 2800, thisMonthQty: 3000, lastUnitPrice: 1.75, thisUnitPrice: 1.89, baseline90d: 1.72, isRecurring: true, cadence: "monthly", riskAlert: true, priceHistory: [1.70, 1.75, 1.82, 1.89] },
    { id: "steel-rebar", product: "Steel Rebar (ton)", vendor: "SteelCo", lastMonthQty: 20, thisMonthQty: 15, lastUnitPrice: 855, thisUnitPrice: 892, baseline90d: 845, isRecurring: true, cadence: "monthly", riskAlert: false, priceHistory: [838, 840, 855, 892] },
    { id: "lubricant", product: "Industrial Lubricant", vendor: "ChemSupply", lastMonthQty: 100, thisMonthQty: 120, lastUnitPrice: 41, thisUnitPrice: 42, baseline90d: 40.5, isRecurring: true, cadence: "monthly", riskAlert: false, priceHistory: [40, 40.5, 41, 42] },
    { id: "cement", product: "Cement (bag)", vendor: "BuildMat", lastMonthQty: 350, thisMonthQty: 400, lastUnitPrice: 8.2, thisUnitPrice: 8.4, baseline90d: 8.2, isRecurring: true, cadence: "monthly", riskAlert: false, priceHistory: [8.15, 8.2, 8.2, 8.4] },
    { id: "gloves", product: "Nitrile Gloves (box)", vendor: "MedSupply", lastMonthQty: 180, thisMonthQty: 240, lastUnitPrice: 9.2, thisUnitPrice: 9.2, baseline90d: 9.3, isRecurring: false, riskAlert: false, priceHistory: [9.4, 9.3, 9.2, 9.2] },
    { id: "paper", product: "A4 Copier Paper", vendor: "BulkSupply", lastMonthQty: 100, thisMonthQty: 100, lastUnitPrice: 4.8, thisUnitPrice: 4.8, baseline90d: 4.85, isRecurring: true, cadence: "monthly", riskAlert: false, priceHistory: [4.9, 4.85, 4.8, 4.8] },
    { id: "cable-ties", product: "Cable Ties (1000pk)", vendor: "CableCo", lastMonthQty: 30, thisMonthQty: 50, lastUnitPrice: 19.5, thisUnitPrice: 19.5, baseline90d: 19.8, isRecurring: false, riskAlert: false, priceHistory: [20, 19.8, 19.5, 19.5] },
    { id: "saas-seats", product: "CloudLedger Seats", vendor: "CloudLedger", lastMonthQty: 42, thisMonthQty: 42, lastUnitPrice: 78, thisUnitPrice: 92, baseline90d: 80, isRecurring: true, cadence: "monthly", riskAlert: true, priceHistory: [76, 78, 78, 92] },
    { id: "freight-route", product: "Freight Route NW", vendor: "Northline", lastMonthQty: 28, thisMonthQty: 34, lastUnitPrice: 1180, thisUnitPrice: 1195, baseline90d: 1175, isRecurring: true, cadence: "weekly", riskAlert: false, priceHistory: [1170, 1175, 1180, 1195] },
    { id: "consult", product: "Strategy Consulting (hr)", vendor: "PeakAdvisors", lastMonthQty: 0, thisMonthQty: 60, lastUnitPrice: 0, thisUnitPrice: 285, baseline90d: 285, isRecurring: false, riskAlert: false, priceHistory: [0, 0, 0, 285] },
    { id: "safety-helmets", product: "Safety Helmets", vendor: "SafetyFirst", lastMonthQty: 40, thisMonthQty: 50, lastUnitPrice: 33.5, thisUnitPrice: 34, baseline90d: 33.5, isRecurring: false, riskAlert: false, priceHistory: [33.5, 33.5, 33.5, 34] },
  ];

  type Derived = Commodity & {
    thisMonthSpend: number;
    lastMonthSpend: number;
    volumeDeltaPct: number; // % change in qty MoM
    priceDeltaPct: number; // % drift vs 90-day baseline
    spendDelta: number;
    growthDollars: number; // attributable to volume change at last month's unit price
    wasteDollars: number;  // attributable to unit-price drift at this month's qty
    newVendorDollars: number; // brand-new spend (no last-month basis)
    quadrant: "active-bleed" | "quiet-leak" | "healthy-growth" | "stable";
    verdict: "Growth" | "Mixed" | "Waste" | "Stable";
  };

  const derived: Derived[] = commodities.map((c) => {
    const thisMonthSpend = c.thisMonthQty * c.thisUnitPrice;
    const lastMonthSpend = c.lastMonthQty * c.lastUnitPrice;
    const isNew = c.lastMonthQty === 0 && c.lastUnitPrice === 0;
    const volumeDeltaPct = isNew ? 100 : ((c.thisMonthQty - c.lastMonthQty) / c.lastMonthQty) * 100;
    const priceDeltaPct = ((c.thisUnitPrice - c.baseline90d) / c.baseline90d) * 100;
    // CLAUDE_NOTE: variance decomposition — growth = qtyDelta × lastUnitPrice; waste = priceDrift × thisQty
    const growthDollars = isNew ? 0 : (c.thisMonthQty - c.lastMonthQty) * c.lastUnitPrice;
    const wasteDollars = isNew ? 0 : (c.thisUnitPrice - c.baseline90d) * c.thisMonthQty;
    const newVendorDollars = isNew ? thisMonthSpend : 0;
    const spendDelta = thisMonthSpend - lastMonthSpend;
    let quadrant: Derived["quadrant"];
    if (priceDeltaPct > 3 && volumeDeltaPct > 5) quadrant = "active-bleed";
    else if (priceDeltaPct > 3 && volumeDeltaPct <= 5) quadrant = "quiet-leak";
    else if (priceDeltaPct <= 3 && volumeDeltaPct > 5) quadrant = "healthy-growth";
    else quadrant = "stable";
    let verdict: Derived["verdict"];
    if (priceDeltaPct > 5 && volumeDeltaPct > 5) verdict = "Mixed";
    else if (priceDeltaPct > 3) verdict = "Waste";
    else if (volumeDeltaPct > 5) verdict = "Growth";
    else verdict = "Stable";
    return { ...c, thisMonthSpend, lastMonthSpend, volumeDeltaPct, priceDeltaPct, spendDelta, growthDollars, wasteDollars, newVendorDollars, quadrant, verdict };
  });

  const baseline = derived.reduce((s, d) => s + d.lastMonthSpend, 0);
  const totalGrowth = derived.reduce((s, d) => s + Math.max(0, d.growthDollars), 0);
  const totalWaste = derived.reduce((s, d) => s + Math.max(0, d.wasteDollars), 0);
  const totalNewVendor = derived.reduce((s, d) => s + d.newVendorDollars, 0);
  const totalThisMonth = derived.reduce((s, d) => s + d.thisMonthSpend, 0);

  type SegmentKey = "all" | "growth" | "waste" | "new";
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey>("all");
  const [selectedCommodityId, setSelectedCommodityId] = useState<string | null>(null);
  const [commodityFilter, setCommodityFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  type VarianceSegment = "baseline" | "growth" | "waste" | "newVendor";
  const [drillSegment, setDrillSegment] = useState<VarianceSegment | null>(null);
  const selected = derived.find((d) => d.id === selectedCommodityId) ?? null;

  // Variance bar data — single stacked row
  const varianceData = [{
    name: "MoM",
    baseline,
    growth: totalGrowth,
    waste: totalWaste,
    newVendor: totalNewVendor,
  }];

  // Filter helper
  const matchesSegment = (d: Derived) =>
    selectedSegment === "all" ||
    (selectedSegment === "growth" && d.growthDollars > 500) ||
    (selectedSegment === "waste" && d.wasteDollars > 200) ||
    (selectedSegment === "new" && d.newVendorDollars > 0);

  const matchesCommodity = (d: Derived) => commodityFilter === "all" || d.id === commodityFilter;

  const visible = derived.filter((d) => matchesSegment(d) && matchesCommodity(d));

  // Color by price drift
  const driftColor = (priceDeltaPct: number) => {
    if (priceDeltaPct > 10) return "hsl(var(--destructive))";
    if (priceDeltaPct > 3) return "hsl(var(--risk-high))";
    return "hsl(var(--finance-emerald))";
  };

  // Bubble radius for scatter (z value)
  const maxSpend = Math.max(...derived.map((d) => d.thisMonthSpend));

  // Sparkline component
  const Sparkline = ({ data, drift }: { data: number[]; drift: number }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 60;
    const h = 20;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    const stroke = driftColor(drift);
    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / range) * h} r={i === data.length - 1 ? 2.5 : 1.5} fill={stroke} />
        ))}
      </svg>
    );
  };

  const recurring = derived.filter((d) => d.isRecurring);
  const discretionary = derived.filter((d) => !d.isRecurring);

  // Segment styles
  const segmentTabs: { key: SegmentKey; label: string; color: string }[] = [
    { key: "all", label: "All", color: "hsl(var(--finance-indigo))" },
    { key: "growth", label: "Volume (Growth)", color: "hsl(var(--finance-emerald))" },
    { key: "waste", label: "Price Drift (Waste)", color: "hsl(var(--destructive))" },
    { key: "new", label: "New Vendors", color: "hsl(var(--finance-indigo-soft))" },
  ];

  return (
    <div className={`${glass} p-6`}>
      {/* ZONE 2: Variance Decomposition Bar */}
      <section className="mb-6 rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Variance decomposition</div>
            <p className="mt-1 text-xs text-muted-foreground">Where did this month's spend actually come from? Volume change vs. unit-price drift.</p>
          </div>
          <div className="flex items-baseline gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last month </span>
              <span className="font-mono font-bold text-foreground">${(baseline / 1000).toFixed(0)}K</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div>
              <span className="text-muted-foreground">This month </span>
              <span className="font-mono font-bold text-foreground">${(totalThisMonth / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={varianceData} layout="vertical" stackOffset="sign" margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis type="number" hide domain={[0, baseline + totalGrowth + totalWaste + totalNewVendor]} />
              <YAxis type="category" dataKey="name" hide />
              <RechartsTooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                formatter={(v: number, n: string) => {
                  const labels: Record<string, string> = {
                    baseline: "Baseline (recurring spend carried over)",
                    growth: "Volume — bought more units at the same unit price",
                    waste: "Price drift — same units cost more vs. 90-day average",
                    newVendor: "New vendor spend — no prior-month basis",
                  };
                  return [`$${(v / 1000).toFixed(1)}K`, labels[n] ?? n];
                }}
              />
              <RechartsBar dataKey="baseline" stackId="v" fill="hsl(217 91% 60%)" radius={[8, 0, 0, 8]} onClick={() => setDrillSegment("baseline")} cursor="pointer">
                <LabelList dataKey="baseline" position="center" formatter={(v: number) => { const pct = (v / (baseline + totalGrowth + totalWaste + totalNewVendor)) * 100; return pct >= 6 ? `${pct.toFixed(0)}%` : ""; }} fill="hsl(var(--background))" fontSize={11} fontWeight={700} />
              </RechartsBar>
              <RechartsBar dataKey="growth" stackId="v" fill="hsl(var(--finance-emerald))" onClick={() => setDrillSegment("growth")} cursor="pointer">
                <LabelList dataKey="growth" position="center" formatter={(v: number) => { const pct = (v / (baseline + totalGrowth + totalWaste + totalNewVendor)) * 100; return pct >= 6 ? `${pct.toFixed(0)}%` : ""; }} fill="hsl(var(--background))" fontSize={11} fontWeight={700} />
              </RechartsBar>
              <RechartsBar dataKey="waste" stackId="v" fill="hsl(var(--destructive))" onClick={() => setDrillSegment("waste")} cursor="pointer">
                <LabelList dataKey="waste" position="center" formatter={(v: number) => { const pct = (v / (baseline + totalGrowth + totalWaste + totalNewVendor)) * 100; return pct >= 6 ? `${pct.toFixed(0)}%` : ""; }} fill="hsl(var(--destructive-foreground))" fontSize={11} fontWeight={700} />
              </RechartsBar>
              <RechartsBar dataKey="newVendor" stackId="v" fill="hsl(var(--finance-indigo))" radius={[0, 8, 8, 0]} onClick={() => setDrillSegment("newVendor")} cursor="pointer">
                <LabelList dataKey="newVendor" position="center" formatter={(v: number) => { const pct = (v / (baseline + totalGrowth + totalWaste + totalNewVendor)) * 100; return pct >= 6 ? `${pct.toFixed(0)}%` : ""; }} fill="hsl(var(--background))" fontSize={11} fontWeight={700} />
              </RechartsBar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>

        {/* Static color legend — clickable to drill down */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={() => setDrillSegment("baseline")} className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-2 text-left transition hover:border-finance-indigo/40 hover:bg-muted/40">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
            <div>
              <div className="text-[11px] font-semibold text-foreground">Baseline</div>
              <div className="text-[10px] leading-snug text-muted-foreground">Recurring spend carried over from last month.</div>
            </div>
          </button>
          <button onClick={() => setDrillSegment("growth")} className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-2 text-left transition hover:border-finance-emerald/50 hover:bg-muted/40">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-finance-emerald" />
            <div>
              <div className="text-[11px] font-semibold text-foreground">Volume (Growth)</div>
              <div className="text-[10px] leading-snug text-muted-foreground">Bought more units at the same unit price.</div>
            </div>
          </button>
          <button onClick={() => setDrillSegment("waste")} className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-2 text-left transition hover:border-destructive/50 hover:bg-muted/40">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />
            <div>
              <div className="text-[11px] font-semibold text-foreground">Price Drift (Waste)</div>
              <div className="text-[10px] leading-snug text-muted-foreground">Same units now cost more vs. 90-day average.</div>
            </div>
          </button>
          <button onClick={() => setDrillSegment("newVendor")} className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-2 text-left transition hover:border-finance-indigo/50 hover:bg-muted/40">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-finance-indigo" />
            <div>
              <div className="text-[11px] font-semibold text-foreground">New Vendors</div>
              <div className="text-[10px] leading-snug text-muted-foreground">First-time vendor spend with no prior basis.</div>
            </div>
          </button>
        </div>

      </section>

      {/* ZONE 3: Growth vs. Waste Quadrant Map */}
      <section className="mb-6 rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Growth vs. Waste quadrant</div>
            <p className="mt-1 text-xs text-muted-foreground">Each dot is one commodity. <strong>Right</strong> = buying more units. <strong>Up</strong> = paying more per unit. <strong>Bigger</strong> = more spend. Click for the full breakdown.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-finance-emerald" /> Flat / down</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--risk-high))" }} /> 3–10% drift</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> {">"}10% drift</span>
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={filterOpen}
                  className="flex h-8 w-[220px] items-center justify-between rounded-full border border-finance-indigo/30 bg-card/80 px-3 text-xs font-medium text-foreground transition hover:bg-muted/40"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Filter size={12} className="text-finance-indigo" />
                    <span className="truncate">
                      {commodityFilter === "all"
                        ? `All commodities (${derived.length})`
                        : derived.find((d) => d.id === commodityFilter)?.product ?? "Filter commodity"}
                    </span>
                  </span>
                  <ChevronsUpDown size={12} className="ml-1 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search commodity or vendor..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No commodities found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { setCommodityFilter("all"); setFilterOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", commodityFilter === "all" ? "opacity-100" : "opacity-0")} />
                        All commodities ({derived.length})
                      </CommandItem>
                      {derived.map((d) => (
                        <CommandItem
                          key={d.id}
                          value={`${d.product} ${d.vendor}`}
                          onSelect={() => { setCommodityFilter(d.id); setFilterOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", commodityFilter === d.id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">
                            {d.product} <span className="text-muted-foreground">· {d.vendor}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="relative h-[420px] rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 via-card/60 to-muted/20 p-2">
          {/* Quadrant labels */}
          <div className="pointer-events-none absolute left-4 top-3 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Quiet leak</div>
          <div className="pointer-events-none absolute right-4 top-3 z-10 text-[10px] font-semibold uppercase tracking-wider text-destructive/80">Active bleed</div>
          <div className="pointer-events-none absolute bottom-3 left-4 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Stable</div>
          <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] font-semibold uppercase tracking-wider text-finance-emerald/80">Healthy growth</div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 32, bottom: 32, left: 32 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                type="number"
                dataKey="volumeDeltaPct"
                name="Volume Δ"
                domain={[-30, 60]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                label={{ value: "Volume change (units MoM)", position: "insideBottom", offset: -16, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="number"
                dataKey="priceDeltaPct"
                name="Price drift"
                domain={[-5, 25]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                label={{ value: "Unit-price drift vs. 90-day", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <ZAxis type="number" dataKey="thisMonthSpend" range={[120, 1400]} domain={[0, maxSpend]} />
              <ReferenceLine x={0} stroke="hsl(var(--foreground) / 0.35)" strokeDasharray="2 2" />
              <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.35)" strokeDasharray="2 2" />
              <RechartsTooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as Derived;
                  return (
                    <div className="max-w-[260px] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">{d.vendor}</div>
                      <div className="text-sm font-semibold">{d.product}</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        Bought <span className="font-semibold text-foreground">{d.volumeDeltaPct >= 0 ? "+" : ""}{d.volumeDeltaPct.toFixed(0)}%</span> units AND paid{" "}
                        <span className="font-semibold" style={{ color: driftColor(d.priceDeltaPct) }}>{d.priceDeltaPct >= 0 ? "+" : ""}{d.priceDeltaPct.toFixed(1)}%</span> per unit vs. 90-day avg.
                      </p>
                      {d.wasteDollars > 0 && (
                        <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs">
                          <span className="font-mono font-bold text-destructive">${d.wasteDollars.toFixed(0)}</span>
                          <span className="text-muted-foreground"> of the increase is waste</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Scatter
                data={visible}
                onClick={(p: { id?: string }) => p?.id && setSelectedCommodityId(p.id)}
                shape={(props: { cx?: number; cy?: number; payload?: Derived; node?: { z?: number } }) => {
                  const { cx, cy, payload, node } = props;
                  if (cx == null || cy == null || !payload) return <g />;
                  const r = Math.sqrt((node?.z ?? 200) / Math.PI);
                  const fill = driftColor(payload.priceDeltaPct);
                  return (
                    <g style={{ cursor: "pointer" }}>
                      {payload.riskAlert && (
                        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={fill} strokeWidth={1.5} className="animate-risk-pulse" />
                      )}
                      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} stroke="hsl(var(--card))" strokeWidth={2} />
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ZONE 4: Inertia Strip */}
      <section className="rounded-2xl border border-finance-indigo/15 bg-card/70 p-5">
        <div className="mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Operational inertia</div>
          <p className="mt-1 text-xs text-muted-foreground">Recurring commitments on top, one-off discretionary spend below. Sparklines show the last 4 unit prices.</p>
        </div>

        {/* Row A — Recurring */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <CalendarDays size={14} className="text-finance-indigo" /> Recurring (predictable cadence)
            <span className="text-muted-foreground font-normal">· {recurring.length} commodities</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recurring.filter(matchesSegment).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedCommodityId(d.id)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3 text-left transition hover:border-finance-indigo/40 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">{d.product}</span>
                    {d.riskAlert && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive animate-risk-pulse" />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{d.vendor}</span>
                    <span>·</span>
                    <span className="capitalize">{d.cadence}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <Sparkline data={d.priceHistory} drift={d.priceDeltaPct} />
                  <span className="font-mono text-[11px] font-semibold" style={{ color: driftColor(d.priceDeltaPct) }}>
                    {d.priceDeltaPct >= 0 ? "+" : ""}{d.priceDeltaPct.toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
            {recurring.filter(matchesSegment).length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No recurring commodities match this segment.</div>
            )}
          </div>
        </div>

        {/* Row B — Discretionary */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <FileText size={14} className="text-finance-indigo" /> Discretionary (one-off this month)
            <span className="text-muted-foreground font-normal">· {discretionary.length} new commitments</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {discretionary.filter(matchesSegment).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedCommodityId(d.id)}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-left transition hover:border-finance-indigo/40 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{d.product}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{d.vendor}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm font-semibold text-foreground">${(d.thisMonthSpend / 1000).toFixed(1)}K</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">new</span>
                </div>
              </button>
            ))}
            {discretionary.filter(matchesSegment).length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No discretionary commodities match this segment.</div>
            )}
          </div>
        </div>
      </section>

      {/* DRILL-DOWN DRAWER */}
      <AnimatePresence>
        {selected && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex justify-end bg-foreground/30" onClick={() => setSelectedCommodityId(null)}>
            <motion.aside
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 text-card-foreground shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">
                    <span className="h-2 w-2 rounded-full" style={{ background: driftColor(selected.priceDeltaPct) }} />
                    {selected.vendor}
                  </div>
                  <h4 className="mt-1 text-lg font-semibold">{selected.product}</h4>
                </div>
                <button onClick={() => setSelectedCommodityId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={16} /></button>
              </div>

              {/* Verdict */}
              <div
                className="mb-4 rounded-xl border p-3"
                style={{
                  borderColor: selected.verdict === "Waste" ? "hsl(var(--destructive) / 0.3)" : selected.verdict === "Growth" ? "hsl(var(--finance-emerald) / 0.3)" : "hsl(var(--border))",
                  background: selected.verdict === "Waste" ? "hsl(var(--destructive) / 0.08)" : selected.verdict === "Growth" ? "hsl(var(--finance-emerald) / 0.08)" : "hsl(var(--muted) / 0.4)",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: selected.verdict === "Waste" ? "hsl(var(--destructive))" : selected.verdict === "Growth" ? "hsl(var(--finance-emerald))" : "hsl(var(--muted-foreground))" }}>Verdict</div>
                <div className="mt-1 text-lg font-bold text-foreground">{selected.verdict}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.verdict === "Growth" && `Volume up ${selected.volumeDeltaPct.toFixed(0)}% with unit price flat — you're scaling efficiently.`}
                  {selected.verdict === "Waste" && `Unit price drifted ${selected.priceDeltaPct.toFixed(1)}% above 90-day average. This is fixable.`}
                  {selected.verdict === "Mixed" && `Volume AND unit price are both up — partly scaling, partly leaking.`}
                  {selected.verdict === "Stable" && `Both volume and unit price are within normal bands. No action needed.`}
                </p>
              </div>

              {/* Decomposition */}
              <div className="mb-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Spend decomposition</div>
                <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total this month</span>
                    <span className="font-mono font-bold text-foreground">${selected.thisMonthSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Baseline (last month)</span>
                    <span className="font-mono text-foreground">${selected.lastMonthSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-finance-emerald">+ Volume change</span>
                    <span className="font-mono font-semibold text-finance-emerald">{selected.growthDollars >= 0 ? "+" : ""}${selected.growthDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-destructive">+ Price drift</span>
                    <span className="font-mono font-semibold text-destructive">{selected.wasteDollars >= 0 ? "+" : ""}${selected.wasteDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Last 4 invoices (synthetic from priceHistory) */}
              <div className="mb-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Unit-price trajectory</div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      {selected.priceHistory.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="w-12 text-muted-foreground">Inv {selected.priceHistory.length - i}</span>
                          <span className="font-mono font-semibold text-foreground">${p.toFixed(2)}</span>
                        </div>
                      )).reverse()}
                    </div>
                    <Sparkline data={selected.priceHistory} drift={selected.priceDeltaPct} />
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-muted-foreground">90-day baseline</span>
                    <span className="font-mono text-foreground">${selected.baseline90d.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selected.verdict === "Waste" || selected.verdict === "Mixed" ? (
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/20 transition hover:opacity-90">
                    <Zap size={14} /> Find arbitrage alternatives
                  </button>
                ) : (
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-finance-indigo px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-finance-indigo/20 transition hover:opacity-90">
                    <CheckCircle2 size={14} /> Lock in current rate
                  </button>
                )}
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                  Negotiate with {selected.vendor}
                </button>
              </div>
            </motion.aside>
          </motion.div>,
          document.body,
        )}
      </AnimatePresence>

      {/* VARIANCE SEGMENT DRILL-DOWN */}
      <AnimatePresence>
        {drillSegment && createPortal(
          (() => {
            const meta = {
              baseline:  { title: "Baseline spend",       subtitle: "Recurring spend carried over from last month",            color: "hsl(var(--muted-foreground))",  total: baseline,        explainer: "This is the floor. Every commodity you bought last month at last month's unit price." },
              growth:    { title: "Volume (Growth)",      subtitle: "You bought more units at the same unit price",            color: "hsl(var(--finance-emerald))",   total: totalGrowth,     explainer: "Healthy: extra spend is explained by buying more, not by paying more per unit. This is your business scaling." },
              waste:     { title: "Price Drift (Waste)",  subtitle: "Same units now cost more vs. 90-day average",             color: "hsl(var(--destructive))",       total: totalWaste,      explainer: "Fixable: same volume, higher unit price. Likely vendor inflation, surcharges, or expired pricing tiers." },
              newVendor: { title: "New Vendor spend",     subtitle: "First-time vendor invoices with no prior-month basis",    color: "hsl(var(--finance-indigo))",    total: totalNewVendor,  explainer: "New commitments worth reviewing. Make sure these are intentional and have approved budgets." },
            }[drillSegment];

            const rows = derived
              .map((d) => {
                const value =
                  drillSegment === "baseline"  ? d.lastMonthSpend :
                  drillSegment === "growth"    ? Math.max(0, d.growthDollars) :
                  drillSegment === "waste"     ? Math.max(0, d.wasteDollars) :
                                                 d.newVendorDollars;
                return { d, value };
              })
              .filter((r) => r.value > 0)
              .sort((a, b) => b.value - a.value);

            const totalForPct = rows.reduce((s, r) => s + r.value, 0) || 1;

            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex justify-end bg-foreground/30" onClick={() => setDrillSegment(null)}>
                <motion.aside
                  initial={{ x: 460, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 460, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 text-card-foreground shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                        Variance segment
                      </div>
                      <h4 className="mt-1 text-lg font-semibold">{meta.title}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">{meta.subtitle}</p>
                    </div>
                    <button onClick={() => setDrillSegment(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={16} /></button>
                  </div>

                  <div className="mb-4 rounded-xl border p-3" style={{ borderColor: `${meta.color.replace("))", ") / 0.3)")}`, background: `${meta.color.replace("))", ") / 0.08)")}` }}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: meta.color }}>Total</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-foreground">${meta.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{meta.explainer}</p>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-finance-indigo">Top contributors</div>
                    <div className="text-[10px] text-muted-foreground">{rows.length} commodit{rows.length === 1 ? "y" : "ies"}</div>
                  </div>

                  <div className="space-y-2">
                    {rows.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No commodities contribute to this segment.</div>
                    )}
                    {rows.map(({ d, value }) => {
                      const pct = (value / totalForPct) * 100;
                      return (
                        <button
                          key={d.id}
                          onClick={() => { setSelectedCommodityId(d.id); setDrillSegment(null); }}
                          className="w-full rounded-xl border border-border bg-card/80 p-3 text-left transition hover:border-finance-indigo/40 hover:bg-muted/40"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-foreground">{d.product}</div>
                              <div className="truncate text-[11px] text-muted-foreground">{d.vendor}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold" style={{ color: meta.color }}>${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                              <div className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% of segment</div>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.aside>
              </motion.div>
            );
          })(),
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
