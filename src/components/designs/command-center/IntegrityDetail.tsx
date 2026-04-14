import { Shield } from "lucide-react";
import { integrityAlerts } from "@/data/mockData";
import DetailView from "./DetailView";

const danger = "#ef4444";
const warn = "#f59e0b";
const purple = "#6366f1";

export default function IntegrityDetail({ onBack }: { onBack: () => void }) {
  return (
    <DetailView icon={Shield} iconColor={danger} title="Integrity Layer" onBack={onBack}>
      <div className="grid gap-4">
        {integrityAlerts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: a.severity === "critical" ? `${danger}15` : a.severity === "high" ? `${warn}15` : `${purple}15`,
                      color: a.severity === "critical" ? danger : a.severity === "high" ? warn : purple,
                    }}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">
                    {a.type.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{a.vendor}</h3>
              </div>
              <span className="text-lg font-bold font-mono" style={{ color: a.severity === "critical" ? danger : warn }}>
                ${a.amount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{a.description}</p>
            <div className="text-[10px] text-gray-400">Detected: {a.date}</div>
          </div>
        ))}
      </div>
    </DetailView>
  );
}
