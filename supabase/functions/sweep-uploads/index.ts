// sweep-uploads: safety net for stale queued jobs and dead-in-flight jobs.
// Meant to be called on a schedule (pg_cron). Processes up to 5 jobs per run.

import { corsHeaders, processClaimed, serviceClient, type ClaimedUpload } from "../_shared/parse.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const sb = serviceClient();

  const { data: claimed, error } = await sb.rpc("claim_next_uploads", { p_limit: 5 });
  if (error) {
    return new Response(JSON.stringify({ error: `claim_next_uploads: ${error.message}` }), { status: 500, headers: jsonHeaders });
  }

  const jobs: ClaimedUpload[] = Array.isArray(claimed) ? claimed as ClaimedUpload[] : [];
  const results = [];
  for (const job of jobs) {
    results.push(await processClaimed(sb, job));
  }

  return new Response(
    JSON.stringify({
      claimed: jobs.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    }),
    { status: 200, headers: jsonHeaders },
  );
});
