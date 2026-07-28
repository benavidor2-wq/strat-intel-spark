// vizql — a tiny in-browser query engine for the drag-and-drop canvas.
import { format, parseISO, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";

export const DIMENSIONS = [
  { id: "Vendor", field: "merchant", type: "dim" },
  { id: "Date", field: "date", type: "dim", isDate: true },
  { id: "Category", field: "category", type: "dim" },
];

export const MEASURES = [
  { id: "Total", field: "total", type: "meas", agg: "SUM", currency: true },
  { id: "Subtotal", field: "subtotal", type: "meas", agg: "SUM", currency: true },
  { id: "Tax", field: "tax", type: "meas", agg: "SUM", currency: true },
];

export const LINE_ITEM_DIMS = [{ id: "Item", field: "name", type: "dim", fromLine: true }];
export const LINE_ITEM_MEASURES = [
  { id: "Unit Price", field: "unit_price", type: "meas", agg: "AVG", currency: true, fromLine: true },
  { id: "Quantity", field: "quantity", type: "meas", agg: "SUM", fromLine: true },
  { id: "Line Total", field: "total_price", type: "meas", agg: "SUM", currency: true, fromLine: true },
];

export const CUSTOM_DIMS = [
  "PO Number", "Project", "Work Order", "Job Code", "Department", "Payment Terms", "Contract Number",
  "Job Site", "Customer Job No", "Acct Job No",
].map((k) => ({ id: k, field: k, type: "dim", fromCustom: true }));

export const ALL_DIMS = [...DIMENSIONS, ...LINE_ITEM_DIMS, ...CUSTOM_DIMS];
export const ALL_MEAS = [...MEASURES, ...LINE_ITEM_MEASURES];

export function findFieldDef(id) {
  return [...ALL_DIMS, ...ALL_MEAS].find((f) => f.id === id);
}

function needsLineFlatten(pills) {
  return pills.some((p) => {
    const def = findFieldDef(p.id);
    return def?.fromLine;
  });
}

function getValue(receipt, def, line) {
  if (def.fromLine) return line ? line[def.field] : undefined;
  if (def.fromCustom) return receipt.custom_fields?.[def.field];
  return receipt[def.field];
}

function dateBucket(dateStr, granularity) {
  const d = parseISO(dateStr);
  switch (granularity) {
    case "Yearly": return format(startOfYear(d), "yyyy");
    case "Quarterly": return format(startOfQuarter(d), "yyyy 'Q'Q");
    case "Weekly": return format(startOfWeek(d), "yyyy-MM-dd");
    case "Daily": return format(d, "yyyy-MM-dd");
    case "Monthly":
    default: return format(startOfMonth(d), "yyyy-MM");
  }
}

// Flatten receipts to rows (either receipt-level or line-item-level).
function flatten(receipts, useLines) {
  if (!useLines) return receipts.map((r) => ({ r, l: null }));
  const rows = [];
  for (const r of receipts) for (const l of r.line_items || []) rows.push({ r, l });
  return rows;
}

function applyFilters(rows, allPills, filters) {
  return rows.filter(({ r, l }) => {
    for (const p of allPills) {
      const f = filters[p.id];
      if (!f) continue;
      const def = findFieldDef(p.id);
      if (!def) continue;
      const val = getValue(r, def, l);
      if (def.type === "meas") {
        if (typeof val !== "number") continue;
        if (f.min != null && val < f.min) return false;
        if (f.max != null && val > f.max) return false;
      } else if (def.isDate) {
        if (f.periods && f.periods.length) {
          const g = p.granularity || f.granularity || "Monthly";
          if (!f.periods.includes(dateBucket(val, g))) return false;
        }
        if (f.range?.from && new Date(val) < new Date(f.range.from)) return false;
        if (f.range?.to && new Date(val) > new Date(f.range.to)) return false;
      } else {
        if (f.include && f.include.length && !f.include.includes(String(val))) return false;
      }
    }
    return true;
  });
}

function aggregate(values, agg) {
  const nums = values.filter((v) => typeof v === "number");
  if (!nums.length) return 0;
  switch (agg) {
    case "AVG": return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "MIN": return Math.min(...nums);
    case "MAX": return Math.max(...nums);
    case "COUNT": return nums.length;
    case "SUM":
    default: return nums.reduce((a, b) => a + b, 0);
  }
}

export function buildChartData(receipts, rows, cols, filters = {}) {
  const allPills = [...rows, ...cols];
  const useLines = needsLineFlatten(allPills);
  let flat = flatten(receipts, useLines);
  flat = applyFilters(flat, allPills, filters);

  const dimPills = allPills.filter((p) => p.type === "dim");
  const measPills = allPills.filter((p) => p.type === "meas");

  const groups = new Map();
  for (const { r, l } of flat) {
    const key = dimPills
      .map((p) => {
        const def = findFieldDef(p.id);
        const v = getValue(r, def, l);
        if (def.isDate) return dateBucket(v, p.granularity || "Monthly");
        return v == null ? "—" : String(v);
      })
      .join("||");
    if (!groups.has(key)) groups.set(key, { key, dims: {}, samples: {} });
    const g = groups.get(key);
    dimPills.forEach((p, i) => {
      const def = findFieldDef(p.id);
      const v = getValue(r, def, l);
      g.dims[p.id] = def.isDate ? dateBucket(v, p.granularity || "Monthly") : v == null ? "—" : String(v);
    });
    for (const p of measPills) {
      const def = findFieldDef(p.id);
      const v = getValue(r, def, l);
      if (!g.samples[p.id]) g.samples[p.id] = [];
      if (typeof v === "number") g.samples[p.id].push(v);
    }
  }

  const out = [];
  for (const g of groups.values()) {
    const row = { ...g.dims, __key: g.key };
    for (const p of measPills) {
      const agg = filters[p.id]?.agg || p.agg || findFieldDef(p.id)?.agg || "SUM";
      row[p.id] = +aggregate(g.samples[p.id] || [], agg).toFixed(2);
    }
    out.push(row);
  }

  // Sort: by first dim (date natural), else by first measure desc
  if (dimPills.length) {
    const first = dimPills[0];
    const def = findFieldDef(first.id);
    out.sort((a, b) => {
      if (def.isDate) return String(a[first.id]).localeCompare(String(b[first.id]));
      const m = measPills[0]?.id;
      if (m) return (b[m] || 0) - (a[m] || 0);
      return String(a[first.id]).localeCompare(String(b[first.id]));
    });
  }

  return { data: out, dims: dimPills, meas: measPills };
}

export function suggestChartType(rows, cols) {
  const all = [...rows, ...cols];
  const dims = all.filter((p) => p.type === "dim");
  const meas = all.filter((p) => p.type === "meas");
  if (!dims.length && !meas.length) return "bar";
  if (!dims.length) return "table";
  const hasDate = dims.some((d) => findFieldDef(d.id)?.isDate);
  if (hasDate) return "line";
  if (!dims.length && meas.length >= 2) return "scatter";
  if (dims.length >= 2) return "grouped-bar";
  return "bar";
}

// Contextual KPIs — up to 4, deduped by label.
export function computeContextualKPIs(receipts, dims = [], meas = []) {
  const kpis = [];
  const total = receipts.reduce((a, r) => a + (r.total || 0), 0);
  const tax = receipts.reduce((a, r) => a + (r.tax || 0), 0);
  const subtotal = receipts.reduce((a, r) => a + (r.subtotal || 0), 0);
  const vendors = new Set(receipts.map((r) => r.merchant));
  const categories = new Set(receipts.map((r) => r.category));
  const months = new Set(receipts.map((r) => (r.date || "").slice(0, 7)));

  const byVendor = {};
  for (const r of receipts) byVendor[r.merchant] = (byVendor[r.merchant] || 0) + r.total;
  const top = Object.entries(byVendor).sort((a, b) => b[1] - a[1])[0];

  const byMonth = {};
  for (const r of receipts) {
    const k = (r.date || "").slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + r.total;
  }
  const monthKeys = Object.keys(byMonth).sort();
  let mom = null;
  if (monthKeys.length >= 2) {
    const last = byMonth[monthKeys[monthKeys.length - 1]];
    const prev = byMonth[monthKeys[monthKeys.length - 2]];
    if (prev) mom = ((last - prev) / prev) * 100;
  }

  const push = (label, value, sub, tint) => {
    if (kpis.find((k) => k.label === label)) return;
    if (kpis.length >= 4) return;
    kpis.push({ label, value, sub, tint });
  };

  push("Total Spend", fmtCurrency(total), `${receipts.length} invoices`, "indigo");
  if (meas.some((m) => m.id === "Tax") || tax > 0) {
    push("Total Tax", fmtCurrency(tax), `${((tax / (subtotal || 1)) * 100).toFixed(1)}% eff.`, "amber");
  }
  if (dims.some((d) => d.id === "Vendor") || vendors.size <= 8) {
    push("Vendors", String(vendors.size), top ? `Top: ${top[0]}` : "", "emerald");
  }
  if (dims.some((d) => d.id === "Category")) {
    push("Categories", String(categories.size), `${months.size} months`, "blue");
  }
  if (dims.some((d) => findFieldDef(d.id)?.isDate) && mom != null) {
    push("MoM Change", `${mom >= 0 ? "+" : ""}${mom.toFixed(1)}%`, "vs prior month", mom >= 0 ? "emerald" : "red");
  }
  if (kpis.length < 4) {
    push("Avg Invoice", fmtCurrency(total / Math.max(1, receipts.length)), "per receipt", "blue");
  }
  return kpis;
}

export function fmtCurrency(v) {
  if (v == null || isNaN(v)) return "$0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

export function uniqueValuesFor(receipts, pillId) {
  const def = findFieldDef(pillId);
  if (!def) return [];
  const set = new Set();
  for (const r of receipts) {
    if (def.fromLine) {
      for (const l of r.line_items || []) {
        const v = l[def.field];
        if (v != null) set.add(String(v));
      }
    } else if (def.fromCustom) {
      // case-insensitive match in custom_fields
      const key = Object.keys(r.custom_fields || {}).find((k) => k.toLowerCase() === def.field.toLowerCase());
      if (key) set.add(String(r.custom_fields[key]));
    } else {
      const v = r[def.field];
      if (v != null) set.add(String(v));
    }
  }
  return Array.from(set).sort();
}

export function measureRange(receipts, pillId) {
  const def = findFieldDef(pillId);
  if (!def) return { min: 0, max: 0 };
  let min = Infinity, max = -Infinity;
  for (const r of receipts) {
    if (def.fromLine) {
      for (const l of r.line_items || []) {
        const v = l[def.field];
        if (typeof v === "number") { min = Math.min(min, v); max = Math.max(max, v); }
      }
    } else {
      const v = r[def.field];
      if (typeof v === "number") { min = Math.min(min, v); max = Math.max(max, v); }
    }
  }
  if (min === Infinity) return { min: 0, max: 0 };
  return { min: Math.floor(min), max: Math.ceil(max) };
}

export function datePeriods(receipts, granularity = "Monthly") {
  const set = new Set();
  for (const r of receipts) if (r.date) set.add(dateBucket(r.date, granularity));
  return Array.from(set).sort();
}
