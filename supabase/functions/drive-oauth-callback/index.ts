// drive-oauth-callback: Google redirects the user's browser here after consent.
// Exchanges the code for tokens, stores the refresh token on the matching
// drive_config row (found via the nonce in `state`), then redirects back to the app.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const oauthErr = url.searchParams.get("error");
  const [nonce, b64return] = state.split(".");
  let returnTo = "";
  try { returnTo = b64return ? atob(b64return) : ""; } catch { /* ignore */ }

  const finish = (result: Record<string, string>) => {
    if (returnTo && /^https?:\/\//.test(returnTo)) {
      const sep = returnTo.includes("?") ? "&" : "?";
      const q = new URLSearchParams(result).toString();
      return new Response(null, { status: 302, headers: { Location: `${returnTo}${sep}${q}` } });
    }
    const ok = result.drive === "connected";
    return new Response(
      `<html><body style="font-family:system-ui;padding:40px;text-align:center">
       <h2>${ok ? "Google Drive connected ✓" : "Connection failed"}</h2>
       <p>${ok ? "You can close this tab and return to Invoiciify." : "Reason: " + (result.reason || "unknown") + ". Close this tab and try again."}</p>
       </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  };

  if (oauthErr) return finish({ drive: "error", reason: oauthErr });
  if (!code || !nonce) return finish({ drive: "error", reason: "missing_code_or_state" });

  const { data: cfg } = await svc.from("drive_config").select("id,user_id").eq("oauth_state", nonce).maybeSingle();
  if (!cfg) return finish({ drive: "error", reason: "invalid_state" });

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return finish({ drive: "error", reason: "oauth_env_missing" });

  const redirectUri = `${supabaseUrl}/functions/v1/drive-oauth-callback`;
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!tok.ok) {
    await svc.from("drive_config").update({ status: "error", last_error: `token exchange ${tok.status}`, oauth_state: null }).eq("id", cfg.id);
    return finish({ drive: "error", reason: "token_exchange" });
  }
  const tj = await tok.json();

  let email: string | null = null;
  try {
    const ui = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tj.access_token}` } });
    if (ui.ok) email = (await ui.json()).email ?? null;
  } catch { /* email is best-effort */ }

  const update: Record<string, unknown> = { status: "connected", oauth_state: null, connected_email: email, last_error: null };
  if (tj.refresh_token) update.refresh_token = tj.refresh_token; // only present on first consent
  await svc.from("drive_config").update(update).eq("id", cfg.id);

  return finish({ drive: "connected" });
});
