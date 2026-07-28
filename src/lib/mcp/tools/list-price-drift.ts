import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { priceDriftItems } from "@/data/mockData";

export default defineTool({
  name: "list_price_drift",
  title: "List price drift items",
  description:
    "Return commodities with unit-price drift vs 90-day average. Optionally filter by status (alert >5%, warning 2–5%, stable <2%).",
  inputSchema: {
    status: z
      .enum(["alert", "warning", "stable"])
      .optional()
      .describe("Filter by drift status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ status }) => {
    const items = status ? priceDriftItems.filter((i) => i.status === status) : priceDriftItems;
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});
