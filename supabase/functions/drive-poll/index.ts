// drive-poll: pull new invoice files from a connected Google Drive folder into
// the ingest queue. Auth via a service-account JWT — Path A (folder shared with
// the service-account email) by default, or Path B (domain-wide delegation) when
// GOOGLE_IMPERSONATE_SUBJECT is set. This function only DOWNLOADS + ENQUEUES;
// the existing sweep-uploads pipeline does the parsing. Invoked by cron and by a
// manual "Sync now" button. Always returns 200; per-folder errors are recorded
// on drive_config.last_error.

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

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

// Only mime types the parser understands are enqueued; anything else in the
// folder (Google-native Docs/Sheets, zips, etc.) is listed but ignored.
const SUPPORTED = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

type SA = { client_email: string; private_key: string; token_uri?: string };
type DriveFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string };

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromString(s: string): string {
  return b64urlFromBytes(new TextEncoder().encode(s));
}
function pkcs8(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: SA, subject?: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = { alg: "RS256", typ: "JWT" };
  const claims: Record<string, unknown> = { iss: sa.client_email, scope: DRIVE_SCOPE, aud, iat: now, exp: now + 3600 };
  if (subject) claims.sub = subject;
  const signingInput = `${b64urlFromString(JSON.stringify(header))}.${b64urlFromString(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8", pkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));
  const assertion = `${signingInput}.${b64urlFromBytes(sig)}`;
  const res = await fetch(aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("google token response had no access_token");
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
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
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

  const saRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!saRaw) {
    return new Response(JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" }), { status: 200, headers: jsonHeaders });
  }
  let sa: SA;
  try { sa = JSON.parse(saRaw); } catch {
    return new Response(JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON" }), { status: 200, headers: jsonHeaders });
  }
  const subject = Deno.env.get("GOOGLE_IMPERSONATE_SUBJECT") || undefined;

  const sb = serviceClient();
  const { data: configs, error: cfgErr } = await sb
    .from("drive_config")
    .select("id,user_id,folder_id,folder_name,files_seen")
    .eq("status", "connected")
    .not("folder_id", "is", null);
  if (cfgErr) {
    return new Response(JSON.stringify({ error: `drive_config: ${cfgErr.message}` }), { status: 200, headers: jsonHeaders });
  }
  if (!configs || configs.length === 0) {
    return new Response(JSON.stringify({ ok: true, note: "no connected drive_config" }), { status: 200, headers: jsonHeaders });
  }

  let token: string;
  try {
    token = await getAccessToken(sa, subject);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    for (const c of configs) {
      await sb.from("drive_config").update({ status: "error", last_error: msg, last_polled_at: new Date().toISOString() }).eq("id", c.id);
    }
    return new Response(JSON.stringify({ error: msg }), { status: 200, headers: jsonHeaders });
  }

  const summary: unknown[] = [];
  for (const c of configs) {
    try {
      const files = await listFolderRecursive(token, c.folder_id as string);
      const supported = files.filter((f) => SUPPORTED.has(f.mimeType));

      const { data: existing } = await sb.from("uploads")
        .select("external_id").eq("user_id", c.user_id).not("external_id", "is", null);
      const known = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id));

      let added = 0, skipped = 0;
      for (const f of supported) {
        if (known.has(f.id)) { skipped++; continue; }
        const bytes = await download(token, f.id);
        const sha = await sha256Hex(bytes);
        const { data: dupe } = await sb.from("uploads")
          .select("id").eq("user_id", c.user_id).eq("content_sha256", sha).maybeSingle();
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
