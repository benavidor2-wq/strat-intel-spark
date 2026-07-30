// CLAUDE_NOTE (Review inbox)
// Purpose: owner triage for receipts the parser flagged (`needs_review`).
// Data contract: `review_queue()` rows via useReviewQueue(); every mutation
//   goes through review_resolve() (useResolveReview) — never a direct write.
// Owner: Pillar A adjacent (Invoice Integrity intake).
import { useEffect, useState } from "react";
import { AlertTriangle, Copy, ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getOriginalFileUrl,
  useResolveReview,
  useReviewQueue,
  type ReviewItem,
  type ReviewPatch,
} from "@/lib/dataSource";

const money = (v: number | null, currency: string | null) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(v);

const sourceLabel = (s: string | null) =>
  s === "google_drive" ? "Google Drive" : s === "email" ? "Email" : "Manual";

export function ReviewTab() {
  const { data: items = [], isLoading } = useReviewQueue();

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-display">
            Review{items.length > 0 && <span className="ml-2 text-muted-foreground">{items.length}</span>}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Invoices the reader wasn't fully confident about — confirm, fix, or remove them.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Loading review queue…
          </div>
        ) : items.length === 0 ? (
          <div className="glass-widget rounded-xl p-10 text-center">
            <p className="text-sm font-semibold">All caught up — nothing needs review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ReviewCard key={item.receipt_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 text-xs" />
    </label>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const resolve = useResolveReview();
  const [form, setForm] = useState({
    merchant: item.merchant ?? "",
    invoice_no: item.invoice_no ?? "",
    date: item.receipt_date ?? "",
    subtotal: item.subtotal == null ? "" : String(item.subtotal),
    tax: item.tax == null ? "" : String(item.tax),
    total: item.total == null ? "" : String(item.total),
    category: item.category ?? "",
  });

  useEffect(() => {
    setForm({
      merchant: item.merchant ?? "",
      invoice_no: item.invoice_no ?? "",
      date: item.receipt_date ?? "",
      subtotal: item.subtotal == null ? "" : String(item.subtotal),
      tax: item.tax == null ? "" : String(item.tax),
      total: item.total == null ? "" : String(item.total),
      category: item.category ?? "",
    });
  }, [item]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reasons = (item.review_reason ?? "")
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean);

  const run = (action: Parameters<typeof resolve.mutate>[0]["action"], patch?: ReviewPatch, msg?: string) =>
    resolve.mutate(
      { receiptId: item.receipt_id, action, patch },
      {
        onSuccess: () => toast.success(msg ?? "Updated"),
        onError: (e: any) => toast.error(e?.message ?? "Action failed"),
      },
    );

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  const openOriginal = async () => {
    if (!item.storage_path) return toast.error("No original file for this receipt");
    try {
      const url = await getOriginalFileUrl(item.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open the original file");
    }
  };

  return (
    <article className="glass-widget rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{item.merchant || "Unknown vendor"}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono-data font-semibold text-foreground">{money(item.total, item.currency)}</span>
            <span>{item.receipt_date ?? "No date"}</span>
            <span>{item.invoice_no ? `#${item.invoice_no}` : "No invoice no."}</span>
            <span className="rounded-full border border-border px-2 py-0.5">{sourceLabel(item.source)}</span>
            {item.filename && (
              <span className="inline-flex items-center gap-1 truncate">
                <FileText size={12} />
                {item.filename}
              </span>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={openOriginal}>
          <ExternalLink size={14} className="mr-1" />
          View original
        </Button>
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <AlertTriangle size={11} />
              {r}
            </span>
          ))}
        </div>
      )}

      {item.is_duplicate && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          <Copy size={12} />
          Flagged as a duplicate of an invoice already in your data
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Merchant" value={form.merchant} onChange={set("merchant")} />
        <Field label="Invoice no." value={form.invoice_no} onChange={set("invoice_no")} />
        <Field label="Date" type="date" value={form.date} onChange={set("date")} />
        <Field label="Category" value={form.category} onChange={set("category")} />
        <Field label="Subtotal" type="number" value={form.subtotal} onChange={set("subtotal")} />
        <Field label="Tax" type="number" value={form.tax} onChange={set("tax")} />
        <Field label="Total" type="number" value={form.total} onChange={set("total")} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.is_duplicate ? (
          <>
            <Button size="sm" disabled={resolve.isPending} onClick={() => run("confirm_duplicate", undefined, "Marked as duplicate")}>
              It's a duplicate
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={resolve.isPending}
              onClick={() => run("not_duplicate", undefined, "Kept as a distinct invoice")}
            >
              Not a duplicate
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" disabled={resolve.isPending} onClick={() => run("approve", undefined, "Approved")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={resolve.isPending}
              onClick={() =>
                run(
                  "save",
                  {
                    merchant: form.merchant || null,
                    invoice_no: form.invoice_no || null,
                    date: form.date || null,
                    subtotal: numOrNull(form.subtotal),
                    tax: numOrNull(form.tax),
                    total: numOrNull(form.total),
                    category: form.category || null,
                  },
                  "Saved & approved",
                )
              }
            >
              Save &amp; approve
            </Button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={resolve.isPending}>
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {item.merchant || "the invoice"} from your data permanently. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => run("delete", undefined, "Invoice deleted")}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}
