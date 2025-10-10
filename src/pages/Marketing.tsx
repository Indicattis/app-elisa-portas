import { BarChart3 } from "lucide-react";
import MarketingAnalise from "@/components/marketing/MarketingAnalise";

export default function Marketing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
          <p className="text-muted-foreground">
            Análise de desempenho e métricas de marketing
          </p>
        </div>
      </div>

      <MarketingAnalise />
    </div>
  );
}
