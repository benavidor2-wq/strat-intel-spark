import { motion } from "framer-motion";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface DetailViewProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export default function DetailView({ icon: Icon, iconColor, title, onBack, children }: DetailViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen"
      style={{ background: "#f8f9fc", color: "#1e1b4b" }}
    >
      <div className="border-b border-gray-200 px-6 py-4 bg-white sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Overview</span>
          </button>
          <div className="flex items-center gap-2 ml-4">
            <Icon size={18} style={{ color: iconColor }} />
            <h2 className="text-lg font-bold" style={{ color: iconColor }}>{title}</h2>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto p-6">
        {children}
      </div>
    </motion.div>
  );
}
