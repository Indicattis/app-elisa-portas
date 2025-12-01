import { Edit2, Trash2 } from "lucide-react";
import { DepositoCaixa, CATEGORIAS_DEPOSITO } from "@/types/caixa";
import { Button } from "@/components/ui/button";

interface DepositoLinhaProps {
  deposito: DepositoCaixa;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function DepositoLinha({ deposito, onClick, onDelete }: DepositoLinhaProps) {
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Deseja excluir este depósito?')) {
              onDelete(deposito.id);
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
