// drive-oauth-start: called by the app's "Connect Google Drive" button (with the
// user's Supabase JWT). Records an anti-CSRF nonce on the user's drive_config row
// and returns the Google consent URL for the frontend to redirect to.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  const authHeader = req.headers.get("Authorization") || "";
  const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "not authenticated" }), { status: 401, headers: jsonHeaders });

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  if (!clientId) return new Response(JSON.stringify({ error: "GOOGLE_OAUTH_CLIENT_ID not set" }), { status: 200, headers: jsonHeaders });

  let returnTo = "";
  try { const b = await req.json(); returnTo = typeof b?.return_to === "string" ? b.return_to : ""; } catch { /* no body */ }

  const nonce = crypto.randomUUID();
  const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: existing } = await svc.from("drive_config").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) {
    await svc.from("drive_config").update({ oauth_state: nonce, status: "connecting", last_error: null }).eq("id", existing.id);
  } else {
    await svc.from("drive_config").insert({ user_id: user.id, provider: "google_drive", oauth_state: nonce, status: "connecting" });
  }

  const redirectUri = `${supabaseUrl}/functions/v1/drive-oauth-callback`;
  const state = `${nonce}.${btoa(returnTo)}`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.readonly openid email",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return new Response(JSON.stringify({ url }), { status: 200, headers: jsonHeaders });
});
