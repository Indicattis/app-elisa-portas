import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, Zap } from "lucide-react";
import { TabelaLinhasEditavel } from "./TabelaLinhasEditavel";
import { AdicionarLinhaModal } from "./AdicionarLinhaModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLabelProdutoExpandido } from "@/utils/tipoProdutoLabels";
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
  temPortaEnrolar?: boolean;
}

interface ItemPadraoPortaEnrolar {
  id: string;
  nome_produto: string;
  descricao_produto: string | null;
  modulo_calculo: string | null;
  valor_calculo: number | null;
  eixo_calculo: string | null;
  setor_responsavel_producao: string | null;
}

// Função para calcular o tamanho automático
function calcularTamanhoAutomatico(
  item: ItemPadraoPortaEnrolar,
  portaLargura?: number,
  portaAltura?: number
): string | null {
  if (!item.modulo_calculo || !item.valor_calculo || !item.eixo_calculo) {
    return null;
  }

  const eixoValor = item.eixo_calculo === 'largura' ? portaLargura : portaAltura;
  
  if (!eixoValor) return null;

  let tamanhoCalculado: number;
  if (item.modulo_calculo === 'acrescimo') {
    tamanhoCalculado = eixoValor + item.valor_calculo;
  } else {
    tamanhoCalculado = eixoValor - item.valor_calculo;
  }

  return tamanhoCalculado.toFixed(2);
}

// Mapeia categoria para setor
const CATEGORIA_TO_SETOR: Record<CategoriaLinha, string> = {
  separacao: 'separacao',
  solda: 'soldagem',
  perfiladeira: 'perfiladeira',
};

export function LinhasAgrupadasPorPorta({
  categoria,
  portas,
  linhas,
  isReadOnly,
  onAdicionarLinha,
  onRemoverLinha,
  onChange,
  linhasEditadas,
  temPortaEnrolar = false,
}: LinhasAgrupadasPorPortaProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [portaSelecionada, setPortaSelecionada] = useState<string | null>(null);
  const [itensPadrao, setItensPadrao] = useState<ItemPadraoPortaEnrolar[]>([]);
  const [loadingItensPadrao, setLoadingItensPadrao] = useState(false);

  // Buscar itens padrão de porta de enrolar quando necessário
  useEffect(() => {
    const fetchItensPadrao = async () => {
      if (!temPortaEnrolar) {
        setItensPadrao([]);
        return;
      }

      setLoadingItensPadrao(true);
      try {
        const setorAtual = CATEGORIA_TO_SETOR[categoria];
        const { data, error } = await supabase
          .from('estoque')
          .select('id, nome_produto, descricao_produto, modulo_calculo, valor_calculo, eixo_calculo, setor_responsavel_producao')
          .eq('item_padrao_porta_enrolar', true)
          .eq('ativo', true)
          .eq('setor_responsavel_producao', setorAtual as 'perfiladeira' | 'soldagem' | 'separacao' | 'pintura');

        if (error) throw error;
        setItensPadrao(data || []);
      } catch (error) {
        console.error('Erro ao buscar itens padrão:', error);
      } finally {
        setLoadingItensPadrao(false);
      }
    };

    fetchItensPadrao();
  }, [temPortaEnrolar, categoria]);

  const handleAbrirModal = (portaId: string) => {
    setPortaSelecionada(portaId);
    setModalAberto(true);
  };

  // Função para adicionar item padrão rapidamente
  const handleAdicionarItemPadrao = async (porta: any, item: ItemPadraoPortaEnrolar) => {
    const tamanhoAuto = calcularTamanhoAutomatico(item, porta.largura, porta.altura);
    const originalId = porta._originalId || porta.id;
    const indicePorta = porta._indicePorta ?? 0;
    
    try {
      await onAdicionarLinha({
        produto_venda_id: originalId,
        indice_porta: indicePorta,
        nome_produto: item.nome_produto,
        descricao_produto: item.descricao_produto || "",
        quantidade: 1,
        tamanho: tamanhoAuto || "",
        estoque_id: item.id,
        categoria_linha: categoria,
      });
      toast.success(`${item.nome_produto} adicionado`);
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  // Verificar se um item padrão já foi adicionado para uma porta
  const itemJaAdicionado = (portaId: string, indicePorta: number, estoqueId: string) => {
    return linhas.some(
      l => l.produto_venda_id === portaId && 
           (l.indice_porta ?? 0) === indicePorta &&
           l.categoria_linha === categoria && 
           l.estoque_id === estoqueId
    );
  };

  // Obter porta selecionada para passar dimensões ao modal
  const portaParaModal = portaSelecionada 
    ? portas.find(p => p.id === portaSelecionada) 
    : null;

    return (
      <div className="space-y-4">
        {portas.map((porta, idx) => {
          const originalId = porta._originalId || porta.id;
          const indicePorta = porta._indicePorta ?? 0;
          const virtualKey = porta._virtualKey || porta.id;
          
          const linhasDaPorta = linhas.filter(
            l => l.produto_venda_id === originalId && 
                 (l.indice_porta ?? 0) === indicePorta &&
                 l.categoria_linha === categoria
          );

          // Filtrar itens padrão que ainda não foram adicionados
          const itensPadraoDisponiveis = itensPadrao.filter(
            item => !itemJaAdicionado(originalId, indicePorta, item.id)
          );
          
          // Label considerando expansão
          const portaLabel = getLabelProdutoExpandido(idx, porta.tipo_produto, porta.largura, porta.altura, porta._totalNoGrupo, porta._indicePorta);
        
          return (
            <Collapsible key={virtualKey} defaultOpen={false}>
              <div className="border-l-4 border-primary pl-3">
                {/* Header da porta - clicável para expandir/colapsar */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between mb-2 hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                      <Badge variant="outline">{portaLabel}</Badge>
                      <span className="text-sm font-medium">
                        {Number(porta.largura).toFixed(2)}m × {Number(porta.altura).toFixed(2)}m
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
                          handleAbrirModal(originalId);
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
                {/* Sugestões de itens padrão para porta de enrolar */}
                {!isReadOnly && temPortaEnrolar && itensPadraoDisponiveis.length > 0 && (
                  <div className="mb-3 p-2 bg-primary/5 border border-primary/20 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Itens sugeridos (porta de enrolar)</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {itensPadraoDisponiveis.map((item) => {
                        const tamanhoPreview = calcularTamanhoAutomatico(item, porta.largura, porta.altura);
                        return (
                          <Button
                            key={item.id}
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleAdicionarItemPadrao(porta, item)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {item.nome_produto}
                            {tamanhoPreview && (
                              <span className="ml-1 text-muted-foreground">({tamanhoPreview}m)</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
          portaLargura={portaParaModal?.largura}
          portaAltura={portaParaModal?.altura}
        />
      )}
    </div>
  );
}
