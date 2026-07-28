import { useState } from "react";
import { BookOpen, Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { savedModels as seed } from "@/data/sampleData";
import { ChartRenderer } from "@/components/canvas/ChartRenderer";
import { buildChartData } from "@/lib/vizql";
import { receipts } from "@/data/sampleData";

export function LibraryTab({ onEdit }: { onEdit?: (m: any) => void }) {
  const [models, setModels] = useState(seed);
  const [preview, setPreview] = useState<any>(null);

  if (!models.length) {
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
                    {m.tags.map((t) => <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{t}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{m.updated_at}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit?.(m)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPreview(m)}><Eye size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setModels(models.filter((x) => x.id !== m.id))}><Trash2 size={14} /></Button>
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
            const cd = buildChartData(receipts, preview.rows, preview.cols, {});
            return <ChartRenderer type={preview.chartType} data={cd.data} dims={cd.dims} meas={cd.meas} />;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
