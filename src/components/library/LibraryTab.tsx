import { useState } from "react";
import { BookOpen, Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// CLAUDE_NOTE (data source)
// Saved Canvas configs (rows/cols/filters/chartType) live in
// `public.saved_models` (owner-RLS) and are read/written exclusively through
// the hooks in @/lib/dataSource. No mock seed.
import { useSavedModels, useDeleteModel, useReceipts, relativeTime, type SavedModel } from "@/lib/dataSource";
import { ChartRenderer } from "@/components/canvas/ChartRenderer";
import { buildChartData } from "@/lib/vizql";

export function LibraryTab({ onEdit }: { onEdit?: (m: SavedModel) => void }) {
  const { data: receipts = [] } = useReceipts();
  const { data: models = [], isLoading } = useSavedModels();
  const del = useDeleteModel();
  const [preview, setPreview] = useState<SavedModel | null>(null);

  if (!isLoading && !models.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
        <BookOpen size={44} className="mb-3 opacity-40" />
        <div className="text-sm">No saved models yet.</div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-display">Library</h1>
      <div className="rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-left font-semibold">Tags</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.description}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {m.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{relativeTime(m.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit?.(m)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPreview(m)}><Eye size={14} /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={del.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${m.name}"? This can't be undone.`)) del.mutate(m.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
          {preview && (() => {
            const cd = buildChartData(receipts, preview.rows, preview.cols, preview.filters ?? {});
            return <ChartRenderer type={preview.chartType} data={cd.data} dims={cd.dims} meas={cd.meas} />;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
