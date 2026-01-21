import { Card, CardContent } from "@/components/ui/card";
import { useFaturamentoMensal } from "@/hooks/useFaturamentoMensal";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface FaturamentoMensalGridProps {
  onMonthClick?: (monthIndex: number) => void;
  selectedMonth?: number | null;
}

export function FaturamentoMensalGrid({ onMonthClick, selectedMonth }: FaturamentoMensalGridProps) {
  const { data: faturamento, isLoading } = useFaturamentoMensal();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-blue-500/10" />
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
      <div className="grid grid-cols-3 gap-2">
        {faturamento?.map((mes, index) => {
          const isCurrentMonth = index === currentMonth;
          const isSelected = selectedMonth === index;
          
          return (
            <Card 
              key={mes.mes} 
              onClick={() => onMonthClick?.(index)}
              className={`
                cursor-pointer transition-all
                ${isCurrentMonth 
                  ? 'bg-blue-500 border-blue-400 hover:bg-blue-400' 
                  : 'bg-blue-600/20 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-400/50'
                }
                ${isSelected && !isCurrentMonth ? 'ring-2 ring-blue-400 bg-blue-500/40' : ''}
              `}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-xs uppercase font-medium mb-1 ${isCurrentMonth ? 'text-white' : 'text-blue-400/70'}`}>
                  {mes.mes}
                </p>
                <p className={`text-base sm:text-lg font-bold leading-tight ${isCurrentMonth ? 'text-white' : 'text-white'}`}>
                  {formatCurrency(mes.valor)}
                </p>
                <p className={`text-[10px] mt-1 ${isCurrentMonth ? 'text-white/70' : 'text-blue-300/50'}`}>
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
