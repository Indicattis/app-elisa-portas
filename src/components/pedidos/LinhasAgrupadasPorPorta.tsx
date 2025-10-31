import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown } from "lucide-react";
import { TabelaLinhasEditavel } from "./TabelaLinhasEditavel";
import { AdicionarLinhaModal } from "./AdicionarLinhaModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PedidoLinha, PedidoLinhaNova, PedidoLinhaUpdate, CategoriaLinha } from "@/hooks/usePedidoLinhas";

interface LinhasAgrupadasPorPortaProps {
  categoria: CategoriaLinha;
  portas: any[];
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (id: string) => Promise<void>;
  onChange: (linhasEditadas: Map<string, PedidoLinhaUpdate>) => void;
  linhasEditadas: Map<string, PedidoLinhaUpdate>;
}

export function LinhasAgrupadasPorPorta({
  categoria,
  portas,
  linhas,
  isReadOnly,
  onAdicionarLinha,
  onRemoverLinha,
  onChange,
  linhasEditadas,
}: LinhasAgrupadasPorPortaProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [portaSelecionada, setPortaSelecionada] = useState<string | null>(null);

  const handleAbrirModal = (portaId: string) => {
    setPortaSelecionada(portaId);
    setModalAberto(true);
  };

  return (
    <div className="space-y-4">
      {portas.map((porta, idx) => {
        const linhasDaPorta = linhas.filter(
          l => l.produto_venda_id === porta.id && l.categoria_linha === categoria
        );
        
        return (
          <Collapsible key={porta.id} defaultOpen={false}>
            <div className="border-l-4 border-primary pl-3">
              {/* Header da porta - clicável para expandir/colapsar */}
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between mb-2 hover:bg-muted/50 p-2 rounded-md transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                    <Badge variant="outline">Porta #{idx + 1}</Badge>
                    <span className="text-sm font-medium">
                      {porta.largura}m × {porta.altura}m
                    </span>
                    {porta.peso_total && (
                      <Badge variant="secondary" className="text-xs">
                        {porta.peso_total.toFixed(2)} kg
                      </Badge>
                    )}
                    {porta.quantidade_tiras && (
                      <Badge variant="secondary" className="text-xs">
                        {porta.quantidade_tiras} {porta.quantidade_tiras === 1 ? 'tira' : 'tiras'}
                      </Badge>
                    )}
                    {linhasDaPorta.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {linhasDaPorta.length} {linhasDaPorta.length === 1 ? 'linha' : 'linhas'}
                      </Badge>
                    )}
                  </div>
                  
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirModal(porta.id);
                      }}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CollapsibleTrigger>
              
              {/* Tabela de linhas da porta - colapsável */}
              <CollapsibleContent>
                {linhasDaPorta.length > 0 ? (
                  <TabelaLinhasEditavel
                    linhas={linhasDaPorta}
                    isReadOnly={isReadOnly}
                    onRemover={onRemoverLinha}
                    onChange={onChange}
                    linhasEditadas={linhasEditadas}
                  />
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground border rounded-md bg-muted/20">
                    Nenhuma linha adicionada para esta porta
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {portaSelecionada && (
        <AdicionarLinhaModal
          open={modalAberto}
          onOpenChange={setModalAberto}
          categoria={categoria}
          portaId={portaSelecionada}
          onAdicionar={onAdicionarLinha}
        />
      )}
    </div>
  );
}
