// Mock data for the 6 Logic Pillars of the Strategic Intelligence Engine

export interface IntegrityAlert {
  id: string;
  type: 'phantom_vendor' | 'duplicate_invoice' | 'split_invoice' | 'mandate_fraud';
  severity: 'critical' | 'high' | 'medium';
  vendor: string;
  amount: number;
  description: string;
  date: string;
}

export interface PriceDriftInvoice {
  invoiceNo: string;
  date: string;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface PriceDriftItem {
  id: string;
  product: string;
  vendor: string;
  currentPrice: number;
  avg90Day: number;
  driftPercent: number;
  status: 'alert' | 'warning' | 'stable';
  recentInvoice: PriceDriftInvoice;
  historicalInvoices: PriceDriftInvoice[];
}

export interface ArbitrageOpportunity {
  id: string;
  product: string;
  vendors: { name: string; price: number; invoiceNo: string; invoiceDate: string; qty: number; total: number }[];
  bestPrice: number;
  currentPrice: number;
  lazyTax: number;
  annualSavings: number;
  monthlyQty: number;
  unit: string;
  contractEnd: string;
  savingsPerUnit: number;
  monthlySavings: number;
}

export interface InventoryItem {
  id: string;
  product: string;
  burnRate: number; // units per day
  currentStock: number;
  daysRemaining: number;
  bulkDiscount: number; // percent
  suggestedAction: string;
}

export interface SpendingTrend {
  period: string;
  revenue: number;
  costs: number;
  margin: number;
}

export interface VendorConsolidation {
  category: string;
  vendorCount: number;
  industryAvg: number;
  redundancyScore: number; // 0-100
  potentialSavings: number;
}

export const integrityAlerts: IntegrityAlert[] = [
  { id: '1', type: 'phantom_vendor', severity: 'critical', vendor: 'Apex Consulting LLC', amount: 47500, description: 'No delivery records found for 6 consecutive invoices', date: '2026-04-12' },
  { id: '2', type: 'split_invoice', severity: 'high', vendor: 'Metro Supplies Inc', amount: 9800, description: 'Three invoices at $9,800 each — just below $10K approval threshold', date: '2026-04-11' },
  { id: '3', type: 'duplicate_invoice', severity: 'high', vendor: 'TechParts Global', amount: 23400, description: 'Invoice #TP-4421 submitted twice with 3-day gap', date: '2026-04-10' },
  { id: '4', type: 'mandate_fraud', severity: 'critical', vendor: 'Greenfield Services', amount: 156000, description: 'Bank details changed 48h before scheduled payment', date: '2026-04-09' },
  { id: '5', type: 'split_invoice', severity: 'medium', vendor: 'Office Pro Direct', amount: 4900, description: 'Pattern of invoices clustering at $4,900 (threshold: $5,000)', date: '2026-04-08' },
];

export const priceDriftItems: PriceDriftItem[] = [
  { id: '1', product: 'Steel Rebar (ton)', vendor: 'SteelCo', currentPrice: 892, avg90Day: 845, driftPercent: 5.6, status: 'alert',
    recentInvoice: { invoiceNo: 'SC-2026-1847', date: '2026-04-10', unitPrice: 892, qty: 15, total: 13380 },
    historicalInvoices: [
      { invoiceNo: 'SC-2026-1201', date: '2026-03-05', unitPrice: 855, qty: 20, total: 17100 },
      { invoiceNo: 'SC-2026-0914', date: '2026-02-12', unitPrice: 840, qty: 18, total: 15120 },
      { invoiceNo: 'SC-2025-4810', date: '2026-01-18', unitPrice: 838, qty: 22, total: 18436 },
    ]},
  { id: '2', product: 'Hydraulic Fluid (L)', vendor: 'ChemSupply', currentPrice: 14.2, avg90Day: 13.8, driftPercent: 2.9, status: 'warning',
    recentInvoice: { invoiceNo: 'CS-2026-0923', date: '2026-04-08', unitPrice: 14.2, qty: 200, total: 2840 },
    historicalInvoices: [
      { invoiceNo: 'CS-2026-0671', date: '2026-03-10', unitPrice: 13.9, qty: 180, total: 2502 },
      { invoiceNo: 'CS-2026-0402', date: '2026-02-05', unitPrice: 13.7, qty: 200, total: 2740 },
    ]},
  { id: '3', product: 'Safety Helmets', vendor: 'SafetyFirst', currentPrice: 34, avg90Day: 33.5, driftPercent: 1.5, status: 'stable',
    recentInvoice: { invoiceNo: 'SF-2026-2210', date: '2026-04-05', unitPrice: 34, qty: 50, total: 1700 },
    historicalInvoices: [
      { invoiceNo: 'SF-2026-1880', date: '2026-03-01', unitPrice: 33.5, qty: 40, total: 1340 },
      { invoiceNo: 'SF-2026-1550', date: '2026-01-28', unitPrice: 33.5, qty: 45, total: 1507.5 },
    ]},
  { id: '4', product: 'Copper Wire (kg)', vendor: 'MetalWorks', currentPrice: 11.8, avg90Day: 10.2, driftPercent: 15.7, status: 'alert',
    recentInvoice: { invoiceNo: 'MW-2026-3392', date: '2026-04-12', unitPrice: 11.8, qty: 500, total: 5900 },
    historicalInvoices: [
      { invoiceNo: 'MW-2026-2901', date: '2026-03-08', unitPrice: 10.5, qty: 450, total: 4725 },
      { invoiceNo: 'MW-2026-2440', date: '2026-02-02', unitPrice: 10.1, qty: 500, total: 5050 },
      { invoiceNo: 'MW-2025-9821', date: '2026-01-10', unitPrice: 9.9, qty: 400, total: 3960 },
    ]},
  { id: '5', product: 'Diesel Fuel (L)', vendor: 'FuelDirect', currentPrice: 1.89, avg90Day: 1.72, driftPercent: 9.9, status: 'alert',
    recentInvoice: { invoiceNo: 'FD-2026-5510', date: '2026-04-11', unitPrice: 1.89, qty: 3000, total: 5670 },
    historicalInvoices: [
      { invoiceNo: 'FD-2026-4820', date: '2026-03-12', unitPrice: 1.75, qty: 2800, total: 4900 },
      { invoiceNo: 'FD-2026-4100', date: '2026-02-08', unitPrice: 1.70, qty: 3000, total: 5100 },
    ]},
  { id: '6', product: 'Cement (bag)', vendor: 'BuildMat', currentPrice: 8.4, avg90Day: 8.2, driftPercent: 2.4, status: 'warning',
    recentInvoice: { invoiceNo: 'BM-2026-1190', date: '2026-04-09', unitPrice: 8.4, qty: 400, total: 3360 },
    historicalInvoices: [
      { invoiceNo: 'BM-2026-0880', date: '2026-03-02', unitPrice: 8.2, qty: 350, total: 2870 },
      { invoiceNo: 'BM-2026-0510', date: '2026-01-25', unitPrice: 8.15, qty: 400, total: 3260 },
    ]},
];

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  { id: '1', product: 'Industrial Lubricant 5W-40', vendors: [{ name: 'ChemSupply', price: 42, invoiceNo: 'CS-2026-0847', invoiceDate: '2026-03-28', qty: 120, total: 5040 }, { name: 'OilMax', price: 38, invoiceNo: 'OM-26-1192', invoiceDate: '2026-04-02', qty: 80, total: 3040 }, { name: 'LubeKing', price: 35.5, invoiceNo: 'LK-4401', invoiceDate: '2026-04-08', qty: 200, total: 7100 }], bestPrice: 35.5, currentPrice: 42, lazyTax: 6.5, annualSavings: 31200, monthlyQty: 400, unit: 'liters', contractEnd: '2026-08-15', savingsPerUnit: 6.5, monthlySavings: 2600 },
  { id: '2', product: 'Nitrile Gloves (box/100)', vendors: [{ name: 'SafetyFirst', price: 12.8, invoiceNo: 'SF-2026-3310', invoiceDate: '2026-03-15', qty: 200, total: 2560 }, { name: 'MedSupply', price: 9.2, invoiceNo: 'MS-7821', invoiceDate: '2026-04-01', qty: 200, total: 1840 }], bestPrice: 9.2, currentPrice: 12.8, lazyTax: 3.6, annualSavings: 17280, monthlyQty: 400, unit: 'boxes', contractEnd: '2026-06-01', savingsPerUnit: 3.6, monthlySavings: 1440 },
  { id: '3', product: 'A4 Copier Paper (ream)', vendors: [{ name: 'OfficePro', price: 6.4, invoiceNo: 'OP-2026-0553', invoiceDate: '2026-03-20', qty: 300, total: 1920 }, { name: 'PaperDirect', price: 5.1, invoiceNo: 'PD-11042', invoiceDate: '2026-03-25', qty: 100, total: 510 }, { name: 'BulkSupply', price: 4.8, invoiceNo: 'BS-6620', invoiceDate: '2026-04-05', qty: 100, total: 480 }], bestPrice: 4.8, currentPrice: 6.4, lazyTax: 1.6, annualSavings: 9600, monthlyQty: 500, unit: 'reams', contractEnd: '2026-09-30', savingsPerUnit: 1.6, monthlySavings: 800 },
  { id: '4', product: 'Cable Ties (1000pk)', vendors: [{ name: 'ElectroParts', price: 24, invoiceNo: 'EP-2026-2290', invoiceDate: '2026-03-18', qty: 50, total: 1200 }, { name: 'CableCo', price: 19.5, invoiceNo: 'CC-8834', invoiceDate: '2026-04-10', qty: 50, total: 975 }], bestPrice: 19.5, currentPrice: 24, lazyTax: 4.5, annualSavings: 5400, monthlyQty: 100, unit: 'packs', contractEnd: '2026-07-20', savingsPerUnit: 4.5, monthlySavings: 450 },
];

export const inventoryItems: InventoryItem[] = [
  { id: '1', product: 'Steel Rebar', burnRate: 12, currentStock: 84, daysRemaining: 7, bulkDiscount: 12, suggestedAction: 'Order 500 units — 12% bulk discount available' },
  { id: '2', product: 'Hydraulic Fluid', burnRate: 45, currentStock: 900, daysRemaining: 20, bulkDiscount: 8, suggestedAction: 'Optimal reorder in 6 days' },
  { id: '3', product: 'Safety Helmets', burnRate: 3, currentStock: 120, daysRemaining: 40, bulkDiscount: 0, suggestedAction: 'Stock healthy — no action needed' },
  { id: '4', product: 'Copper Wire', burnRate: 28, currentStock: 196, daysRemaining: 7, bulkDiscount: 15, suggestedAction: 'URGENT: Order 1000kg — 15% discount at 1000+ units' },
  { id: '5', product: 'Diesel Fuel', burnRate: 200, currentStock: 3000, daysRemaining: 15, bulkDiscount: 5, suggestedAction: 'Consider locking price — upward trend detected' },
];

export const spendingTrends: SpendingTrend[] = [
  { period: 'Q1 2025', revenue: 2400000, costs: 1680000, margin: 30 },
  { period: 'Q2 2025', revenue: 2650000, costs: 1908000, margin: 28 },
  { period: 'Q3 2025', revenue: 2800000, costs: 2072000, margin: 26 },
  { period: 'Q4 2025', revenue: 3100000, costs: 2356000, margin: 24 },
  { period: 'Q1 2026', revenue: 3250000, costs: 2567500, margin: 21 },
];

export const vendorConsolidation: VendorConsolidation[] = [
  { category: 'Office Supplies', vendorCount: 14, industryAvg: 4, redundancyScore: 85, potentialSavings: 42000 },
  { category: 'Raw Materials', vendorCount: 8, industryAvg: 5, redundancyScore: 45, potentialSavings: 18500 },
  { category: 'IT Equipment', vendorCount: 11, industryAvg: 3, redundancyScore: 78, potentialSavings: 67000 },
  { category: 'Maintenance', vendorCount: 6, industryAvg: 3, redundancyScore: 55, potentialSavings: 23000 },
  { category: 'Logistics', vendorCount: 9, industryAvg: 4, redundancyScore: 62, potentialSavings: 51000 },
];

// Summary stats
export const summaryStats = {
  totalAnomalies: 5,
  criticalAlerts: 2,
  totalLazyTax: 63480,
  inflationLeaks: 3,
  vendorBloatScore: 65,
  marginErosion: -9, // percentage points over 5 quarters
  totalPotentialSavings: 201500,
  activeVendors: 48,
  industryAvgVendors: 19,
};
