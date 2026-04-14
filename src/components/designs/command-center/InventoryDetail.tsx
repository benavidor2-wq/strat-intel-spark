import { BarChart3 } from "lucide-react";
import { inventoryItems } from "@/data/mockData";
import DetailView from "./DetailView";

const danger = "#ef4444";
const warn = "#f59e0b";
const green = "#22c55e";

export default function InventoryDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={BarChart3} iconColor={green} title="Predictive Ordering" onBack={onBack}>
      <div className="grid gap-4">
        {inventoryItems.map((item) => {
          const urgencyColor = item.daysRemaining <= 7 ? danger : item.daysRemaining <= 15 ? warn : green;
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{item.product}</h3>
                <span className="text-lg font-bold font-mono" style={{ color: urgencyColor }}>{item.daysRemaining}d</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                <div>
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider">Burn Rate</div>
                  <div className="font-mono font-semibold text-gray-700">{item.burnRate}/day</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider">Stock</div>
                  <div className="font-mono font-semibold text-gray-700">{item.currentStock} units</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider">Bulk Discount</div>
                  <div className="font-mono font-semibold" style={{ color: item.bulkDiscount > 0 ? green : "#9ca3af" }}>
                    {item.bulkDiscount > 0 ? `${item.bulkDiscount}%` : "—"}
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((item.daysRemaining / 40) * 100, 100)}%`,
                  backgroundColor: urgencyColor,
                }} />
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{item.suggestedAction}</p>
            </div>
          );
        })}
      </div>
    </DetailView>
  );
}
