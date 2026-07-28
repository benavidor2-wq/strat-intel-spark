// CLAUDE_NOTE (upload UI)
// Purpose: single entry point for manual invoice ingestion (files OR whole folders).
// Data contract:
//   - Writes: uploadInvoices(files, onProgress) from @/lib/dataSource.
//   - Reads: useUploads() for the live list.
//   - Retry: retryUpload() re-invokes parse-upload.
// Folder upload:
//   - <input webkitdirectory> yields FileList with nested files.
//   - Junk (.DS_Store, Thumbs.db, non-invoice extensions) is silently
//     skipped when the pick came from a folder — folders always contain
//     noise and listing each junk file drowns the outcome panel. We show
//     a single "N non-invoice files skipped" summary instead.
// Progress:
//   - uploadInvoices reports per-file, so we render "Processed X of N" and
//     append outcome rows as they complete rather than freezing until the
//     whole batch finishes.
// Guardrail:
//   - Selections over LARGE_SELECTION_THRESHOLD require an inline confirm
//     since parsing uses AI credits.
// Owner: ingestion UI.
import { useCallback, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Upload as UploadIcon,
  FolderUp,
  FileText,
  FileX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_UPLOAD_BYTES,
  retryUpload,
  uploadInvoices,
  useUploads,
  type UploadOutcome,
  type UploadRow,
  type UploadStatus,
} from "@/lib/dataSource";

const ACCEPT_ATTR = [
  ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
  ".docx", ".xlsx", ".xls", ".csv",
].join(",");

const ACCEPTED_EXT_RE = /\.(pdf|jpe?g|png|webp|heic|heif|docx|xlsx|xls|csv)$/i;
const LARGE_SELECTION_THRESHOLD = 200;

function prettyBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function statusMeta(s: UploadStatus): { label: string; className: string; Icon: any } {
  switch (s) {
    case "queued":       return { label: "Queued",       className: "bg-muted text-muted-foreground",  Icon: Clock };
    case "processing":   return { label: "Processing",   className: "bg-indigo-100 text-indigo-700",   Icon: Loader2 };
    case "complete":     return { label: "Complete",     className: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 };
    case "needs_review": return { label: "Needs review", className: "bg-amber-100 text-amber-700",     Icon: AlertCircle };
    case "failed":       return { label: "Failed",       className: "bg-red-100 text-red-700",         Icon: AlertCircle };
  }
}

/** Coerce anything into a string so the UI can never print "[object Object]". */
function reasonText(r: unknown): string {
  if (typeof r === "string") return r;
  if (r == null) return "Rejected.";
  if (r instanceof Error) return r.message;
  if (typeof r === "object") {
    const o = r as Record<string, unknown>;
    for (const k of ["message", "error_description", "error", "hint", "details", "code"]) {
      const v = o[k];
      if (typeof v === "string" && v) return v;
    }
    try { return JSON.stringify(r); } catch { /* noop */ }
  }
  return String(r);
}

type Pending = {
  files: File[];
  skippedJunk: number;
  fromFolder: boolean;
};

export function UploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<UploadOutcome[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const { data: uploads = [] } = useUploads(50);

  /** Split a raw file list into { toIngest, skippedJunk, preflightRejects }.
   *  Folder picks silently drop non-invoice files; explicit multi-file picks
   *  still surface each rejection so the owner sees the mistake. */
  const triage = useCallback((raw: File[], fromFolder: boolean) => {
    const toIngest: File[] = [];
    const preflight: UploadOutcome[] = [];
    let skippedJunk = 0;
    for (const f of raw) {
      const extOk = ACCEPTED_EXT_RE.test(f.name);
      if (!extOk) {
        if (fromFolder) skippedJunk += 1;
        else preflight.push({ file: f.name, status: "rejected", reason: "Unsupported file type." });
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        preflight.push({ file: f.name, status: "rejected", reason: "File is larger than 50 MB." });
        continue;
      }
      toIngest.push(f);
    }
    return { toIngest, preflight, skippedJunk };
  }, []);

  const runIngest = useCallback(async (files: File[], preflight: UploadOutcome[], skippedJunk: number) => {
    setOutcomes(preflight);
    setProgress({ done: 0, total: files.length });
    setBusy(true);
    try {
      const live: UploadOutcome[] = [...preflight];
      await uploadInvoices(files, (o, done, total) => {
        live.push(o);
        setOutcomes([...live]);
        setProgress({ done, total });
      });
      if (skippedJunk > 0) {
        // Note it once, at the end, so the panel isn't a wall of noise.
        setOutcomes((prev) => [
          ...prev,
          { file: `${skippedJunk} non-invoice file${skippedJunk === 1 ? "" : "s"} skipped`, status: "rejected", reason: "Skipped folder contents that aren't PDF/image/Office/CSV." },
        ]);
      }
    } finally {
      setBusy(false);
      setProgress(null);
      if (filesInputRef.current) filesInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  }, []);

  const handleRawFiles = useCallback((list: FileList | File[], fromFolder: boolean) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    const { toIngest, preflight, skippedJunk } = triage(arr, fromFolder);
    if (!toIngest.length) {
      setOutcomes(preflight);
      if (skippedJunk > 0) {
        setOutcomes((prev) => [
          ...prev,
          { file: `${skippedJunk} non-invoice file${skippedJunk === 1 ? "" : "s"} skipped`, status: "rejected", reason: "Skipped folder contents that aren't PDF/image/Office/CSV." },
        ]);
      }
      return;
    }
    if (toIngest.length >= LARGE_SELECTION_THRESHOLD) {
      setPending({ files: toIngest, skippedJunk, fromFolder });
      setOutcomes(preflight);
      return;
    }
    void runIngest(toIngest, preflight, skippedJunk);
  }, [triage, runIngest]);

  // Drag-and-drop: use webkitGetAsEntry to descend into dropped folders.
  const collectEntry = async (entry: any, out: File[]): Promise<void> => {
    if (!entry) return;
    if (entry.isFile) {
      await new Promise<void>((resolve) => entry.file((f: File) => { out.push(f); resolve(); }, () => resolve()));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readAll = () => new Promise<any[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
      // readEntries returns in batches; keep going until empty.
      while (true) {
        const batch = await readAll();
        if (!batch.length) break;
        for (const e of batch) await collectEntry(e, out);
      }
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.items;
    let fromFolder = false;
    if (items && items.length && (items[0] as any).webkitGetAsEntry) {
      const out: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = (items[i] as any).webkitGetAsEntry?.();
        if (entry?.isDirectory) fromFolder = true;
        if (entry) await collectEntry(entry, out);
      }
      if (out.length) { handleRawFiles(out, fromFolder); return; }
    }
    if (e.dataTransfer.files?.length) handleRawFiles(e.dataTransfer.files, false);
  };

  const doRetry = async (id: string) => {
    setRetrying((r) => ({ ...r, [id]: true }));
    try {
      await retryUpload(id);
    } catch (e) {
      console.error("retry failed", e);
    } finally {
      setRetrying((r) => ({ ...r, [id]: false }));
    }
  };

  const confirmPending = () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    void runIngest(p.files, [], p.skippedJunk);
  };

  const progressPct = useMemo(() => {
    if (!progress || !progress.total) return 0;
    return Math.round((progress.done / progress.total) * 100);
  }, [progress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon size={18} /> Upload invoices
          </DialogTitle>
          <DialogDescription>
            PDF, images (JPEG / PNG / WEBP / HEIC), Word, or Excel / CSV. Up to 50 MB per file.
            Duplicates are detected automatically — the same file will never be ingested twice.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
          )}
        >
          <UploadIcon size={28} className="text-muted-foreground" />
          <div className="text-sm font-semibold">Drop files or a folder here</div>
          <div className="text-xs text-muted-foreground">Or pick from your computer:</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => filesInputRef.current?.click()}>
              <UploadIcon size={14} className="mr-1.5" /> Upload files
            </Button>
            <Button size="sm" variant="outline" onClick={() => folderInputRef.current?.click()}>
              <FolderUp size={14} className="mr-1.5" /> Upload folder
            </Button>
          </div>
          <input
            ref={filesInputRef}
            type="file"
            multiple
            hidden
            accept={ACCEPT_ATTR}
            onChange={(e) => e.target.files && handleRawFiles(e.target.files, false)}
          />
          {/* React doesn't type webkitdirectory; set it imperatively. */}
          <input
            ref={(el) => {
              folderInputRef.current = el;
              if (el) {
                el.setAttribute("webkitdirectory", "");
                el.setAttribute("directory", "");
              }
            }}
            type="file"
            multiple
            hidden
            onChange={(e) => e.target.files && handleRawFiles(e.target.files, true)}
          />
        </div>

        {/* Large-selection confirmation */}
        {pending && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="mb-2 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                You're about to upload <strong>{pending.files.length.toLocaleString()} files</strong>
                {pending.skippedJunk > 0 && ` (${pending.skippedJunk} non-invoice files will be skipped)`}.
                Parsing runs in the background and uses AI credits. Continue?
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmPending}>Continue</Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {busy && progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Processed {progress.done.toLocaleString()} of {progress.total.toLocaleString()}
              </span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* This-batch outcomes */}
        {outcomes.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This batch
            </div>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2">
                  {o.status === "queued" && <Clock size={12} className="mt-0.5 text-muted-foreground" />}
                  {o.status === "duplicate" && <CheckCircle2 size={12} className="mt-0.5 text-emerald-600" />}
                  {o.status === "rejected" && <AlertCircle size={12} className="mt-0.5 text-red-600" />}
                  <div className="flex-1">
                    <div className="font-semibold">{o.file}</div>
                    <div className="text-muted-foreground">
                      {o.status === "queued" && "Queued for parsing"}
                      {o.status === "duplicate" && `Already ingested ${formatDistanceToNow(new Date(o.ingested_at), { addSuffix: true })} — skipped`}
                      {o.status === "rejected" && reasonText((o as any).reason)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent uploads (live) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent uploads
            </div>
            {uploads.length > 0 && (
              <div className="text-[10px] text-muted-foreground">
                {uploads.length} shown
              </div>
            )}
          </div>
          {uploads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              No uploads yet. Drop a file above to get started.
            </div>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {uploads.map((u) => <UploadRowItem key={u.id} row={u} retrying={!!retrying[u.id]} onRetry={() => doRetry(u.id)} />)}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadRowItem({
  row,
  retrying,
  onRetry,
}: {
  row: UploadRow;
  retrying: boolean;
  onRetry: () => void;
}) {
  const meta = statusMeta(row.status);
  const Icon = meta.Icon;
  const spinning = row.status === "processing";
  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <FileText size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{row.filename}</div>
            <div className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
              {row.byte_size ? ` · ${prettyBytes(row.byte_size)}` : ""}
              {row.receipt_count > 0 && ` · ${row.receipt_count} receipt${row.receipt_count === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.className)}>
            <Icon size={10} className={spinning ? "animate-spin" : ""} />
            {meta.label}
          </span>
          {row.status === "failed" && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRetry} disabled={retrying || row.attempts >= 3} title={row.attempts >= 3 ? "Retry limit reached" : "Retry"}>
              <RefreshCw size={12} className={retrying ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>
      {row.status === "failed" && row.error_message && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
          <AlertCircle size={11} className="mt-0.5 shrink-0" />
          <span className="flex-1">{reasonText(row.error_message)}</span>
        </div>
      )}
      {row.status === "needs_review" && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
          <AlertCircle size={11} className="mt-0.5 shrink-0" />
          <span className="flex-1">
            Parsed, but something needs a human look — open the receipt to review before it feeds the pillars.
          </span>
        </div>
      )}
    </li>
  );
}
