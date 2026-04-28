import { BarChart3 } from "lucide-react";
import MarketingAnalise from "@/components/marketing/MarketingAnalise";
import { UltimasVendas } from "@/components/marketing/UltimasVendas";

export default function Marketing() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Marketing</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Análise de desempenho e métricas
          </p>
        </div>
      </div>

      <MarketingAnalise />
      
      <UltimasVendas />
    </div>
  );
}
