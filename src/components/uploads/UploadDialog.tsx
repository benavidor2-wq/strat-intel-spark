// CLAUDE_NOTE (upload UI)
// Purpose: single entry point for manual invoice ingestion.
// Data contract:
//   - Writes: uploadInvoices() from @/lib/dataSource — hashes, dedupes,
//     uploads to `raw-uploads`, inserts uploads row, invokes parse-upload.
//   - Reads: useUploads() for the live list. Realtime flips the badge
//     queued -> processing -> complete/needs_review/failed without polling.
//   - Retry: retryUpload() re-invokes parse-upload; the RPC caps attempts
//     at 3 and reuses the cached `extracted` blob so it's cheap.
// Owner: ingestion UI (feeds A–E through Receipts).
import { useCallback, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Upload as UploadIcon,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
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
  ACCEPTED_UPLOAD_TYPES,
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

function prettyBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function statusMeta(s: UploadStatus): { label: string; className: string; Icon: any } {
  switch (s) {
    case "queued":       return { label: "Queued",       className: "bg-muted text-muted-foreground",              Icon: Clock };
    case "processing":   return { label: "Processing",   className: "bg-indigo-100 text-indigo-700",               Icon: Loader2 };
    case "complete":     return { label: "Complete",     className: "bg-emerald-100 text-emerald-700",             Icon: CheckCircle2 };
    case "needs_review": return { label: "Needs review", className: "bg-amber-100 text-amber-700",                 Icon: AlertCircle };
    case "failed":       return { label: "Failed",       className: "bg-red-100 text-red-700",                     Icon: AlertCircle };
  }
}

export function UploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<UploadOutcome[]>([]);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const { data: uploads = [] } = useUploads(50);

  const handleFiles = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;

    // Client-side gate: give quick feedback for the obvious rejects before
    // paying for hash/upload round trips.
    const preflight: UploadOutcome[] = [];
    const toIngest: File[] = [];
    for (const f of files) {
      const typeOk = ACCEPTED_UPLOAD_TYPES.includes(f.type) ||
        /\.(pdf|jpe?g|png|webp|heic|heif|docx|xlsx|xls|csv)$/i.test(f.name);
      if (!typeOk) {
        preflight.push({ file: f.name, status: "rejected", reason: "Unsupported file type." });
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        preflight.push({ file: f.name, status: "rejected", reason: "File is larger than 50 MB." });
        continue;
      }
      toIngest.push(f);
    }

    setOutcomes(preflight);
    if (!toIngest.length) return;

    setBusy(true);
    try {
      const results = await uploadInvoices(toIngest);
      setOutcomes([...preflight, ...results]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
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
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50",
          )}
        >
          <UploadIcon size={28} className="text-muted-foreground" />
          <div className="text-sm font-semibold">Drop files here or click to browse</div>
          <div className="text-xs text-muted-foreground">Multiple files supported</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={ACCEPT_ATTR}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Hashing and uploading…
          </div>
        )}

        {/* This-batch outcomes */}
        {outcomes.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This batch
            </div>
            <ul className="space-y-1.5 text-xs">
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
                      {o.status === "rejected" && o.reason}
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
          <span className="flex-1">{row.error_message}</span>
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
