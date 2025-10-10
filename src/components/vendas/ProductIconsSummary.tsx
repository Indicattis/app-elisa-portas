import { DoorOpen, Plus, Hammer, Palette, Wrench } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductIconsSummaryProps {
  venda: any;
}

export function ProductIconsSummary({ venda }: ProductIconsSummaryProps) {
  const produtos = venda.produtos_vendas || [];
  
  const hasPortas = produtos.some((p: any) => 
    ['porta', 'porta_enrolar'].includes(p.tipo_produto)
  );
  
  const hasAcessoriosOuAdicionais = produtos.some((p: any) => 
    ['acessorio', 'adicional'].includes(p.tipo_produto)
  );
  
  const hasManutencao = produtos.some((p: any) => p.tipo_produto === 'manutencao');
  const hasInstalacao = (venda.valor_instalacao || 0) > 0;
  const hasPintura = (venda.valor_pintura || 0) > 0 || produtos.some((p: any) => p.tipo_produto === 'pintura_epoxi');
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Ícone de Porta */}
        {hasPortas && (
          <Tooltip>
            <TooltipTrigger asChild>
              <DoorOpen className="w-5 h-5 text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Portas</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Ícone de Acessórios/Adicionais */}
        {hasAcessoriosOuAdicionais && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Plus className="w-5 h-5 text-gray-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Acessórios/Adicionais</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Ícone de Pintura */}
        {hasPintura && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Palette className="w-5 h-5 text-purple-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Pintura</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Ícone de Instalação */}
        {hasInstalacao && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Hammer className="w-5 h-5 text-orange-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Instalação</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Ícone de Manutenção */}
        {hasManutencao && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Wrench className="w-5 h-5 text-green-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Manutenção</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {!hasPortas && !hasAcessoriosOuAdicionais && !hasInstalacao && !hasPintura && !hasManutencao && (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>
    </TooltipProvider>
  );
}
