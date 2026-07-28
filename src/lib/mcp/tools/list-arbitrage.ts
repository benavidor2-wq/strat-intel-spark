import { defineTool } from "@lovable.dev/mcp-js";
import { arbitrageOpportunities } from "../../data/mockData";

export default defineTool({
  name: "list_arbitrage_opportunities",
  title: "List vendor arbitrage opportunities",
  description:
    "Return lazy-tax arbitrage opportunities across vendors. Each item includes bestPrice, currentPrice, lazyTax, monthlySavings and annualSavings.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      { type: "text", text: JSON.stringify(arbitrageOpportunities, null, 2) },
    ],
    structuredContent: { opportunities: arbitrageOpportunities },
  }),
});
