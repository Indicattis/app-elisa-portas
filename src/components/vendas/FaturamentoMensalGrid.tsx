import { Card, CardContent } from "@/components/ui/card";
import { useFaturamentoMensal } from "@/hooks/useFaturamentoMensal";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export function FaturamentoMensalGrid() {
  const { data: faturamento, isLoading } = useFaturamentoMensal();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const currentMonth = new Date().getMonth();

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-white/60" />
          <h3 className="text-sm font-medium text-white/60">Faturamento {new Date().getFullYear()}</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-white/60" />
        <h3 className="text-sm font-medium text-white/60">Faturamento {new Date().getFullYear()}</h3>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
        {faturamento?.map((mes, index) => {
          const isCurrentMonth = index === currentMonth;
          const hasValue = mes.valor > 0;
          
          return (
            <Card 
              key={mes.mes} 
              className={`
                border transition-all
                ${isCurrentMonth 
                  ? 'bg-blue-500/20 border-blue-500/40' 
                  : hasValue 
                    ? 'bg-primary/5 border-primary/10' 
                    : 'bg-primary/5 border-primary/10 opacity-50'
                }
              `}
            >
              <CardContent className="p-2 text-center">
                <p className={`text-[10px] uppercase font-medium ${isCurrentMonth ? 'text-blue-400' : 'text-white/40'}`}>
                  {mes.mes}
                </p>
                <p className={`text-sm font-bold ${isCurrentMonth ? 'text-blue-300' : 'text-white'}`}>
                  {formatCurrency(mes.valor)}
                </p>
                <p className="text-[9px] text-white/30">
                  {mes.numero_vendas} venda{mes.numero_vendas !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
