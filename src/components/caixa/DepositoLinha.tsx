import { Badge } from "@/components/ui/badge";
import { Edit2 } from "lucide-react";
import { DepositoCaixa, CATEGORIAS_DEPOSITO } from "@/types/caixa";
import { Button } from "@/components/ui/button";

interface DepositoLinhaProps {
  deposito: DepositoCaixa;
  onClick: () => void;
}

export function DepositoLinha({ deposito, onClick }: DepositoLinhaProps) {
  const categoria = CATEGORIAS_DEPOSITO[deposito.categoria];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div 
      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 flex-1">
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0" 
          style={{ backgroundColor: categoria.color }}
        />
        <span className="text-sm font-bold">{formatCurrency(Number(deposito.valor))}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
