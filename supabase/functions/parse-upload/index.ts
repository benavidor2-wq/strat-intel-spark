// parse-upload: worker endpoint invoked by the client (or the sweeper).
// POST { upload_id }. Always returns 200; failures are recorded via fail_upload.

import { corsHeaders, processClaimed, serviceClient, type ClaimedUpload } from "../_shared/parse.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  let body: { upload_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400, headers: jsonHeaders });
  }
  const uploadId = body?.upload_id?.trim();
  if (!uploadId) {
    return new Response(JSON.stringify({ error: "upload_id required" }), { status: 400, headers: jsonHeaders });
  }

  const sb = serviceClient();

  const { data: claim, error: claimErr } = await sb.rpc("claim_upload", { p_upload_id: uploadId });
  if (claimErr) {
    return new Response(JSON.stringify({ error: `claim_upload: ${claimErr.message}` }), { status: 500, headers: jsonHeaders });
  }
  if (!claim) {
    return new Response(JSON.stringify({ skipped: true, upload_id: uploadId }), { status: 200, headers: jsonHeaders });
  }

  const result = await processClaimed(sb, claim as ClaimedUpload);
  return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
});
