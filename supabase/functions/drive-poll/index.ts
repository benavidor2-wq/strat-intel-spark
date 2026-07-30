// drive-poll: pull new invoice files from each connected Google Drive folder into
// the ingest queue. Auth uses the per-user OAuth refresh token on drive_config
// (set by the drive-oauth-start / drive-oauth-callback flow). This function only
// DOWNLOADS + ENQUEUES; sweep-uploads does the parsing. Invoked by cron and a
// manual "Sync now". Always returns 200; per-folder errors go to last_error.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

const SUPPORTED = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

type DriveFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string };

async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not set");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`token refresh ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("token refresh returned no access_token");
  return j.access_token as string;
}

async function listFolderRecursive(token: string, rootId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  const stack = [rootId];
  const seen = new Set<string>();
  while (stack.length) {
    const folder = stack.pop()!;
    if (seen.has(folder)) continue;
    seen.add(folder);
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: `'${folder}' in parents and trashed=false`,
        fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime)",
        pageSize: "1000",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`drive list ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const j = await res.json();
      for (const f of (j.files ?? []) as DriveFile[]) {
        if (f.mimeType === "application/vnd.google-apps.folder") stack.push(f.id);
        else files.push(f);
      }
      pageToken = j.nextPageToken;
    } while (pageToken);
  }
  return files;
}

async function download(token: string, fileId: string): Promise<Uint8Array> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`drive download ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...d].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeName(name: string): string {
  return (name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 180) || "file";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  const sb = serviceClient();
  const { data: configs, error: cfgErr } = await sb
    .from("drive_config")
    .select("id,user_id,folder_id,folder_name,files_seen,refresh_token")
    .eq("status", "connected")
    .not("folder_id", "is", null)
    .not("refresh_token", "is", null);
  if (cfgErr) return new Response(JSON.stringify({ error: `drive_config: ${cfgErr.message}` }), { status: 200, headers: jsonHeaders });
  if (!configs || configs.length === 0) return new Response(JSON.stringify({ ok: true, note: "no connected drive_config" }), { status: 200, headers: jsonHeaders });

  const summary: unknown[] = [];
  for (const c of configs) {
    try {
      const token = await accessTokenFromRefresh(c.refresh_token as string);
      const files = await listFolderRecursive(token, c.folder_id as string);
      const supported = files.filter((f) => SUPPORTED.has(f.mimeType));

      const { data: existing } = await sb.from("uploads").select("external_id").eq("user_id", c.user_id).not("external_id", "is", null);
      const known = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id));

      let added = 0, skipped = 0;
      for (const f of supported) {
        if (known.has(f.id)) { skipped++; continue; }
        const bytes = await download(token, f.id);
        const sha = await sha256Hex(bytes);
        const { data: dupe } = await sb.from("uploads").select("id").eq("user_id", c.user_id).eq("content_sha256", sha).maybeSingle();
        if (dupe) { skipped++; continue; }
        const path = `${c.user_id}/gdrive/${f.id}/${safeName(f.name)}`;
        const up = await sb.storage.from("raw-uploads").upload(path, bytes, { contentType: f.mimeType, upsert: true });
        if (up.error) throw new Error(`storage upload: ${up.error.message}`);
        const ins = await sb.from("uploads").insert({
          user_id: c.user_id,
          source: "google_drive",
          storage_path: path,
          filename: f.name,
          mime_type: f.mimeType,
          byte_size: bytes.length,
          content_sha256: sha,
          external_id: f.id,
          status: "queued",
        });
        if (ins.error) {
          if ((ins.error as { code?: string }).code === "23505") { skipped++; continue; }
          throw new Error(`insert upload: ${ins.error.message}`);
        }
        added++;
      }

      await sb.from("drive_config").update({
        status: "connected",
        last_error: null,
        last_polled_at: new Date().toISOString(),
        files_seen: (c.files_seen ?? 0) + added,
      }).eq("id", c.id);
      summary.push({ config: c.id, folder: c.folder_name ?? c.folder_id, listed: files.length, supported: supported.length, added, skipped });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb.from("drive_config").update({ status: "error", last_error: msg, last_polled_at: new Date().toISOString() }).eq("id", c.id);
      summary.push({ config: c.id, error: msg });
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), { status: 200, headers: jsonHeaders });
});
