// In-memory sample data for Invoiciify. No backend.

const VENDORS = ["The Home Depot", "Lowe's", "Ace Hardware", "White Cap", "Fastenal", "Grainger"];
const CATEGORIES = ["Construction", "Safety", "Tools", "Electrical", "Plumbing", "Site Prep"];
const PROJECTS = ["Northgate Industrial Park", "Riverside Tower", "Elm St Retail", "Harbor Warehouse"];
const DEPTS = ["Site Prep", "Framing", "MEP", "Finishing"];
const TERMS = ["Net 30", "Net 15", "Due on Receipt", "Net 45"];

const ITEM_POOL = [
  ["Fire Extinguisher 10lb ABC (unit)", 85],
  ["Framing Lumber 2x4x8 (bd)", 6.4],
  ["Concrete Mix 60lb (bag)", 5.75],
  ["Rebar #4 20ft (ea)", 9.2],
  ["Safety Helmet Type II (ea)", 34],
  ["Nitrile Gloves (box/100)", 12.8],
  ["Cordless Drill 20V Kit", 189],
  ["Copper Wire 12AWG (100ft)", 78],
  ["PVC Pipe 4in x 10ft", 22.5],
  ["Insulation R-19 (roll)", 48],
  ["Screw Kit Assorted", 24.9],
  ["Hi-Vis Vest Class 2", 18.5],
  ["Job Site Radio", 149],
  ["Ladder 24ft Ext", 289],
  ["Diesel Fuel (gal)", 4.15],
];

function seed(n) {
  const rng = (function(s){return function(){s=(s*9301+49297)%233280;return s/233280;};})(n);
  return rng;
}
const rand = seed(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const intBetween = (a, b) => Math.floor(rand() * (b - a + 1)) + a;

function makeDate(i, total) {
  // Spread across Jan 2 – Apr 12, 2026 (~100 days)
  const start = new Date(2026, 0, 2).getTime();
  const end = new Date(2026, 3, 12).getTime();
  const t = start + ((end - start) * i) / Math.max(1, total - 1);
  const d = new Date(t + intBetween(-2, 2) * 86400000);
  return d.toISOString().slice(0, 10);
}

function makeReceipt(i, total) {
  const merchant = pick(VENDORS);
  const category = pick(CATEGORIES);
  const numItems = intBetween(2, 5);
  const line_items = [];
  let subtotal = 0;
  for (let k = 0; k < numItems; k++) {
    const [name, base] = pick(ITEM_POOL);
    const qty = intBetween(2, 40);
    const unit = +(base * (0.9 + rand() * 0.25)).toFixed(2);
    const tp = +(qty * unit).toFixed(2);
    subtotal += tp;
    line_items.push({ name, quantity: qty, unit_price: unit, total_price: tp });
  }
  subtotal = +subtotal.toFixed(2);
  const tax = +(subtotal * 0.09).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const date = makeDate(i, total > 0 ? 45 : 45);
  const poSeq = 100 + i;
  return {
    id: `rcp_${i + 1}`,
    merchant,
    date,
    subtotal,
    tax,
    total,
    currency: "USD",
    category,
    filename: `${merchant.toLowerCase().replace(/[^a-z]/g, "")}_${date}_${poSeq}.pdf`,
    line_items,
    custom_fields: {
      "PO Number": `PO-2026-0${poSeq}`,
      "Project": pick(PROJECTS),
      "Work Order": `WO-${intBetween(3000, 3999)}`,
      "Job Code": `JC-${intBetween(100, 999)}`,
      "Department": pick(DEPTS),
      "Payment Terms": pick(TERMS),
      "Contract Number": `CN-${intBetween(2020, 2099)}`,
    },
  };
}

export const receipts = Array.from({ length: 45 }, (_, i) => makeReceipt(i, 45));

export const cfoMessages = [
  {
    id: "msg_1",
    subject: "Q1 Spend Analysis: 3 Fast Wins Identified",
    unread: true,
    spend_dna: "Construction-heavy, vendor-concentrated",
    top_impact_metric: "$3,200 monthly savings available",
    health_score: 84,
    created_at: "2026-04-11T09:30:00Z",
    summary:
      "Your Q1 spending shows healthy volume growth but three concrete arbitrage opportunities. Consolidating hardware across Home Depot and Lowe's alone would recover an estimated $3.2K/month with no service-level impact.",
    insights: [
      "Vendor concentration risk: 62% of spend flows through 2 vendors.",
      "Safety category shows a 14% MoM increase — worth investigating.",
      "Payment terms mix skews to Net 30 — good for float.",
    ],
  },
  {
    id: "msg_2",
    subject: "Alert: Price Drift Detected on Copper Wire",
    unread: true,
    spend_dna: "Materials-driven",
    top_impact_metric: "8.4% unit-price increase vs 90-day avg",
    health_score: 62,
    created_at: "2026-04-09T14:12:00Z",
    summary:
      "Copper Wire 12AWG shows a persistent upward drift across the last 4 invoices. Consider locking a 90-day price with your preferred vendor.",
    insights: ["Drift is vendor-agnostic → commodity-driven.", "Suggested action: forward-buy 2 months of stock."],
  },
  {
    id: "msg_3",
    subject: "Monthly Health Report — March 2026",
    unread: false,
    spend_dna: "Balanced",
    top_impact_metric: "Health score improved +6 pts",
    health_score: 78,
    created_at: "2026-04-01T08:00:00Z",
    summary: "Overall financial health is trending up. Fewer late invoices and better vendor diversification.",
    insights: ["Late invoice ratio down from 11% to 4%.", "New vendor added: White Cap."],
  },
];

export const savedModels = [
  {
    id: "sm_1",
    name: "Vendor Spend Overview",
    description: "Bar chart of total spend by vendor with tax breakout.",
    tags: ["vendors", "spend"],
    created_at: "2026-03-14",
    updated_at: "2026-04-02",
    rows: [{ id: "Vendor", type: "dim", field: "merchant" }],
    cols: [{ id: "Total", type: "meas", field: "total", agg: "SUM" }],
    filters: [],
    chartType: "bar",
  },
  {
    id: "sm_2",
    name: "Monthly Spend Trend",
    description: "Line chart of total spend over time by month.",
    tags: ["trend", "time"],
    created_at: "2026-03-20",
    updated_at: "2026-04-05",
    rows: [{ id: "Date", type: "dim", field: "date", granularity: "Monthly" }],
    cols: [{ id: "Total", type: "meas", field: "total", agg: "SUM" }],
    filters: [],
    chartType: "line",
  },
];

export const notifications = [
  { id: "n1", title: "New CFO insight available", body: "Q1 Spend Analysis is ready.", time: "2h ago", unread: true },
  { id: "n2", title: "Price drift alert", body: "Copper Wire 12AWG +8.4%.", time: "1d ago", unread: true },
  { id: "n3", title: "Weekly report", body: "Your weekly summary is available.", time: "3d ago", unread: false },
];
