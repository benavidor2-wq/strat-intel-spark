import { defineTool } from "@lovable.dev/mcp-js";
import {
  spendByCategory,
  vendorMonthlySpend,
  vendorConsolidation,
  summaryStats,
} from "../../data/mockData";

export default defineTool({
  name: "get_spend_summary",
  title: "Get spend summary",
  description:
    "Return the top-level spend summary: total anomalies, lazy tax, vendor bloat, potential savings, spend by category, and vendor monthly spend.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const payload = {
      summary: summaryStats,
      spendByCategory,
      vendorMonthlySpend,
      vendorConsolidation,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
