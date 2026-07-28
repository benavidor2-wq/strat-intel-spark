import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listIntegrityAlerts from "./tools/list-integrity-alerts";
import listPriceDrift from "./tools/list-price-drift";
import listArbitrage from "./tools/list-arbitrage";
import spendSummary from "./tools/spend-summary";

// Direct Supabase issuer (never the .lovable.cloud proxy). Vite inlines this at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "strategic-intelligence-mcp",
  title: "Strategic Intelligence",
  version: "0.1.0",
  instructions:
    "Tools for the Strategic Intelligence procurement dashboard. Query invoice integrity alerts, price drift, vendor arbitrage opportunities, and top-level spend summary.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listIntegrityAlerts, listPriceDrift, listArbitrage, spendSummary],
});
