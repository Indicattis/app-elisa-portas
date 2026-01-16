import { DoorOpen, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProdutosIconsProps {
  produtos: any[];
}

export function ProdutosIcons({ produtos }: ProdutosIconsProps) {
  if (!produtos || produtos.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  // Contar tipos de produtos considerando a quantidade real
  const tiposCounts = produtos.reduce((acc, produto) => {
    const tipo = produto.tipo_produto?.toLowerCase() || "";
    const quantidade = produto.quantidade || 1;
    acc[tipo] = (acc[tipo] || 0) + quantidade;
    return acc;
  }, {} as Record<string, number>);

  // Extrair cores únicas
  const cores = [...new Set(produtos.map((p) => p.cor).filter(Boolean))] as string[];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(tiposCounts).map(([tipo, count]: [string, number]) => {
          const isPortaEnrolar = tipo.includes("enrolar");
          const isPorta = tipo.includes("porta");
          
          if (isPorta || isPortaEnrolar) {
            return (
              <Tooltip key={tipo}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <DoorOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPortaEnrolar ? "Portas de Enrolar" : "Portas"}: {count}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return (
            <Tooltip key={tipo}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium">{count}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tipo}: {count}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {cores.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            {cores.slice(0, 3).map((cor, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ 
                      backgroundColor: cor === "Branco" ? "#fff" : 
                                     cor === "Preto" ? "#000" : 
                                     cor === "Cinza" ? "#808080" : "#ccc"
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{cor}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {cores.length > 3 && (
              <span className="text-xs text-muted-foreground">+{cores.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
