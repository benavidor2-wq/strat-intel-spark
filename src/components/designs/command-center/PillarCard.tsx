import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";

interface PillarCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle: string;
  metric: string;
  metricColor: string;
  metricLabel: string;
  children: React.ReactNode;
  onClick: () => void;
  delay?: number;
}

const card = "bg-white border border-gray-200 rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group h-full flex flex-col";

export default function PillarCard({ icon: Icon, iconColor, title, subtitle, metric, metricColor, metricLabel, children, onClick, delay = 0 }: PillarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={card}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: iconColor }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: iconColor }}>{title}</span>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold" style={{ color: metricColor }}>{metric}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">{metricLabel}</span>
      </div>
      <p className="text-[11px] text-gray-500 mb-3">{subtitle}</p>
      {children}
    </motion.div>
  );
}
