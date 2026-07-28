import { defineTool } from "@lovable.dev/mcp-js";
import { integrityAlerts } from "../../data/mockData";

export default defineTool({
  name: "list_integrity_alerts",
  title: "List invoice integrity alerts",
  description:
    "Return open invoice integrity alerts (phantom vendors, duplicates, split invoices, mandate fraud).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(integrityAlerts, null, 2) }],
    structuredContent: { alerts: integrityAlerts },
  }),
});
