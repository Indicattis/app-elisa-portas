import { Badge } from "@/components/ui/badge";
import { DoorOpen, Wrench, Hammer, Palette } from "lucide-react";

interface ProductIconsSummaryProps {
  venda: any;
}

export function ProductIconsSummary({ venda }: ProductIconsSummaryProps) {
  const portas = venda.portas || [];
  
  const totalPortas = portas.filter((p: any) => 
    ['porta_pivotante', 'porta_de_correr', 'porta_camarão'].includes(p.tipo_produto)
  ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
  
  const totalAcessorios = portas.filter((p: any) => 
    p.tipo_produto === 'acessorio'
  ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
  
  const hasInstalacao = (venda.valor_instalacao || 0) > 0;
  const hasPintura = (venda.valor_pintura || 0) > 0;
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {totalPortas > 0 && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <DoorOpen className="w-3 h-3" />
          {totalPortas}
        </Badge>
      )}
      
      {totalAcessorios > 0 && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Wrench className="w-3 h-3" />
          {totalAcessorios}
        </Badge>
      )}
      
      {hasInstalacao && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Hammer className="w-3 h-3" />
        </Badge>
      )}
      
      {hasPintura && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Palette className="w-3 h-3" />
        </Badge>
      )}
      
      {totalPortas === 0 && totalAcessorios === 0 && !hasInstalacao && !hasPintura && (
        <span className="text-xs text-muted-foreground">Nenhum produto</span>
      )}
    </div>
  );
}
