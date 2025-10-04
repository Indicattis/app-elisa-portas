import { DoorOpen, Wrench, Hammer, Palette } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductIconsSummaryProps {
  venda: any;
}

export function ProductIconsSummary({ venda }: ProductIconsSummaryProps) {
  const portas = venda.portas || [];
  
  const totalPortas = portas.filter((p: any) => 
    ['porta_pivotante', 'porta_de_correr', 'porta_camarão', 'porta_de_enrolar'].includes(p.tipo_produto)
  ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
  
  const totalAcessorios = portas.filter((p: any) => 
    p.tipo_produto === 'acessorio'
  ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
  
  const hasInstalacao = (venda.valor_instalacao || 0) > 0;
  const hasPintura = (venda.valor_pintura || 0) > 0;
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {/* Ícones de Portas */}
        {totalPortas > 0 && Array.from({ length: Math.min(totalPortas, 10) }).map((_, i) => (
          <Tooltip key={`porta-${i}`}>
            <TooltipTrigger asChild>
              <DoorOpen className="w-4 h-4 text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Porta</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {totalPortas > 10 && (
          <span className="text-xs font-medium text-blue-600">+{totalPortas - 10}</span>
        )}
        
        {/* Ícones de Acessórios */}
        {totalAcessorios > 0 && Array.from({ length: Math.min(totalAcessorios, 10) }).map((_, i) => (
          <Tooltip key={`acessorio-${i}`}>
            <TooltipTrigger asChild>
              <Wrench className="w-4 h-4 text-gray-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Acessório</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {totalAcessorios > 10 && (
          <span className="text-xs font-medium text-gray-600">+{totalAcessorios - 10}</span>
        )}
        
        {/* Ícone de Instalação */}
        {hasInstalacao && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Hammer className="w-4 h-4 text-orange-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Com instalação</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Ícone de Pintura */}
        {hasPintura && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Palette className="w-4 h-4 text-purple-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Com pintura</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {totalPortas === 0 && totalAcessorios === 0 && !hasInstalacao && !hasPintura && (
          <span className="text-xs text-muted-foreground">Nenhum produto</span>
        )}
      </div>
    </TooltipProvider>
  );
}
