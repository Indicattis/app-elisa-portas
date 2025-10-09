import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  isFaturada: boolean;
  isParcial?: boolean;
}

export function StatusBadge({ isFaturada, isParcial = false }: StatusBadgeProps) {
  if (isFaturada) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Faturada</span>
        </div>
      </div>
    );
  }

  if (isParcial) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Parcial</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendente</span>
      </div>
    </div>
  );
}