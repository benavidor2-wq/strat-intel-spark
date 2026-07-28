import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ScanText, BrainCircuit, MousePointerClick, ShieldAlert, Zap, Globe2, Check, ArrowRight, Sparkles,
} from "lucide-react";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  { icon: ScanText, tint: "indigo", title: "Gemini OCR Ingestion", body: "Drop a PDF, photo, or scan. We extract line items, taxes, vendors, and custom fields in seconds." },
  { icon: BrainCircuit, tint: "emerald", title: "5-Pillar CFO Analysis", body: "Integrity, drift, arbitrage, vendor bloat, and operational inertia — reviewed on every invoice." },
  { icon: MousePointerClick, tint: "amber", title: "Drag-and-Drop Analytics", body: "Build charts the way you think. Pills, shelves, and instant results — no SQL, no wait." },
  { icon: ShieldAlert, tint: "red", title: "Fraud & Compliance", body: "Phantom vendors, duplicate invoices, mandate fraud — flagged before they get paid." },
  { icon: Zap, tint: "blue", title: "Instant Arbitrage", body: "See exactly which vendor is overcharging you and what switching would save this month." },
  { icon: Globe2, tint: "indigo", title: "Industry-Agnostic", body: "Construction, retail, manufacturing, services — the engine adapts to your spend DNA." },
];

const tintMap: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function Website() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/60 px-1.5 py-1 md:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/app"><Button size="sm" className="rounded-full">Get Started Free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16">
        <div className="absolute inset-0 dot-grid opacity-40" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={14} /> AI-Powered Financial Intelligence
            </span>
            <h1 className="mt-6 text-5xl font-extrabold tracking-display leading-[1.05] md:text-6xl lg:text-7xl">
              Your invoices.<br />
              <span className="text-primary">Your CFO.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Invoiciify turns every receipt, PO, and vendor invoice into an executive-grade
              financial insight — automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app"><Button size="lg" className="rounded-full">Start free <ArrowRight size={16} className="ml-1" /></Button></Link>
              <a href="#features"><Button size="lg" variant="outline" className="rounded-full">See features</Button></a>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" />No credit card</span>
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" />50 invoices free</span>
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" />2-min setup</span>
            </div>
          </motion.div>

          {/* Mockup */}
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <div className="glass-widget rounded-2xl p-4">
              <div className="flex items-center gap-1.5 pb-3">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-xs text-muted-foreground">invoiciify.app / mycfo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Health Score", value: "84", tint: "emerald" },
                  { label: "Top Impact", value: "$3,200", tint: "indigo" },
                  { label: "Unread Alerts", value: "2", tint: "amber" },
                ].map((k) => (
                  <div key={k.label} className={`rounded-xl border p-3 ${tintMap[k.tint]}`}>
                    <div className="text-[10px] font-semibold uppercase opacity-80">{k.label}</div>
                    <div className="mt-1 font-mono-data text-2xl font-bold tracking-display">{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { icon: "📈", subj: "Q1 Spend Analysis: 3 Fast Wins Identified", meta: "Health 84 · $3.2K/mo opportunity", unread: true },
                  { icon: "⚠️", subj: "Alert: Price Drift on Copper Wire", meta: "+8.4% vs 90-day avg", unread: true },
                  { icon: "🧾", subj: "Monthly Health Report — March 2026", meta: "Score +6 pts", unread: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-base">{m.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm ${m.unread ? "font-semibold" : ""}`}>{m.subj}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.meta}</div>
                    </div>
                    {m.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Features</div>
          <h2 className="mt-2 text-4xl font-extrabold tracking-display md:text-5xl">Every invoice, understood.</h2>
          <p className="mt-4 text-muted-foreground">Six capabilities that turn documents into decisions.</p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass-widget rounded-2xl p-6">
              <div className={`inline-grid h-11 w-11 place-items-center rounded-xl border ${tintMap[f.tint]}`}>
                <f.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">About</div>
            <h2 className="mt-2 text-4xl font-extrabold tracking-display md:text-5xl">Built for the finance team of one.</h2>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-4 text-muted-foreground">
            <p>Most small and mid-sized businesses can't afford a full CFO — so critical financial signals get buried in paper receipts and PDFs.</p>
            <p>Invoiciify was built to be the CFO you don't have: a system that reads every invoice, spots what matters, and tells you what to do next.</p>
            <p>Trusted by 1,200+ operators across construction, retail, hospitality, and services.</p>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Pricing</div>
          <h2 className="mt-2 text-4xl font-extrabold tracking-display md:text-5xl">Simple, transparent plans.</h2>
        </motion.div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { name: "Starter", price: "$0", per: "/mo", features: ["50 invoices / mo", "Canvas analytics", "Basic CFO insights"], cta: "Start free" },
            { name: "Pro", price: "$49", per: "/mo", features: ["Unlimited invoices", "Full 5-Pillar CFO", "Fraud & drift alerts", "Priority support"], cta: "Try Pro", featured: true },
            { name: "Team", price: "$149", per: "/mo", features: ["Everything in Pro", "5 team seats", "Custom dimensions", "SSO + audit log"], cta: "Contact us" },
          ].map((p) => (
            <motion.div key={p.name} {...fadeUp} className={`rounded-2xl border p-6 ${p.featured ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {p.featured && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">POPULAR</span>}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono-data text-5xl font-extrabold tracking-display">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check size={16} className="text-emerald-500" />{f}</li>)}
              </ul>
              <Link to="/app"><Button className="mt-6 w-full rounded-full" variant={p.featured ? "default" : "outline"}>{p.cta}</Button></Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</div>
            <h2 className="mt-2 text-4xl font-extrabold tracking-display md:text-5xl">Let's talk.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">Questions, custom deployments, or press — we usually reply within one business day.</p>
          </motion.div>
          <motion.form {...fadeUp} onSubmit={(e) => e.preventDefault()} className="glass-widget rounded-2xl p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Your name" />
              <Input type="email" placeholder="Work email" />
            </div>
            <Input placeholder="Company" />
            <Textarea placeholder="How can we help?" rows={5} />
            <Button type="submit" className="w-full rounded-full">Send message</Button>
          </motion.form>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <Logo size={22} />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Docs</a>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 Invoiciify</div>
        </div>
      </footer>
    </div>
  );
}
