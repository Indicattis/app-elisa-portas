import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, MapPin, Info } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

interface OrdemCarregamentoCardProps {
  ordem: OrdemCarregamento;
  onClick?: (ordem: OrdemCarregamento) => void;
  dragListeners?: any;
}

export const OrdemCarregamentoCard = ({
  ordem,
  onClick,
  dragListeners,
}: OrdemCarregamentoCardProps) => {
  // Cor baseada no tipo de serviço: Entrega (azul) ou Instalação (vermelho)
  const getTipoServicoColor = (tipoCarregamento: string | null) => {
    switch (tipoCarregamento) {
      case 'autorizados':
        // Entrega - Tom azulado
        return 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20';
      case 'elisa':
        // Instalação - Tom vermelho
        return 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20';
      default:
        return 'bg-muted border-border';
    }
  };

  // Pegar a instalação através do pedido
  const instalacaoData = ordem.pedido?.instalacao;
  const instalacao = Array.isArray(instalacaoData) ? instalacaoData[0] : instalacaoData;
  const equipeNome = instalacao?.responsavel_instalacao_nome;

  return (
    <Card 
      className={`relative h-[35px] p-2 border transition-all duration-200 cursor-pointer ${getTipoServicoColor(ordem.tipo_carregamento)}`}
      onClick={() => onClick?.(ordem)}
    >
      {/* Header - Sempre visível */}
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing" {...dragListeners}>
          <h4 className="font-semibold text-xs truncate">{ordem.nome_cliente}</h4>
          {/* Badge de Serviço */}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
            {ordem.venda?.tipo_entrega === 'entrega' ? 'Entrega' : 'Instalação'}
          </Badge>
          {/* Badge de Responsável */}
          <Badge 
            variant="secondary" 
            className="text-[9px] px-1 py-0 h-4 shrink-0"
          >
            {ordem.venda?.tipo_entrega === 'entrega' 
              ? (ordem.tipo_carregamento === 'elisa' ? 'Entrega Elisa' : ordem.tipo_carregamento === 'terceiro' ? 'Terceiro' : 'Autorizado')
              : (ordem.tipo_carregamento === 'elisa' ? 'Instalação Elisa' : 'Autorizado')
            }
          </Badge>
          {/* Tag de equipe - apenas para instalação Elisa */}
          {ordem.venda?.tipo_entrega === 'instalacao' && ordem.tipo_carregamento === 'elisa' && equipeNome && (
            <Badge 
              variant="secondary" 
              className="text-[9px] px-1 py-0 h-4 shrink-0 bg-red-500/20 border-red-500/40"
            >
              {equipeNome}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {ordem.venda && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-0.5 hover:bg-accent rounded-md transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="space-y-2">
                    <div className="font-semibold text-xs border-b border-border pb-1">
                      {ordem.venda?.cliente_nome || ordem.nome_cliente}
                    </div>

                    {/* Tipo de Serviço */}
                    <div className="flex items-center gap-1 text-xs">
                      <Package className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium">
                        {ordem.venda?.tipo_entrega === 'entrega' ? 'Entrega' : 'Instalação'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {ordem.venda?.tipo_entrega === 'entrega' 
                          ? (ordem.tipo_carregamento === 'elisa' ? 'Entrega Elisa' : ordem.tipo_carregamento === 'terceiro' ? 'Terceiro' : 'Autorizado')
                          : (ordem.tipo_carregamento === 'elisa' ? 'Instalação Elisa' : 'Autorizado')
                        }
                      </span>
                    </div>

                    {/* Responsável - mostrar equipe para instalação Elisa */}
                    {ordem.venda?.tipo_entrega === 'instalacao' && ordem.tipo_carregamento === 'elisa' && equipeNome && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Equipe: {equipeNome}</span>
                      </div>
                    )}
                    
                    {ordem.venda.cidade && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{ordem.venda.cidade}/{ordem.venda.estado}</span>
                      </div>
                    )}

                    {ordem.venda.data_prevista_entrega && (
                      <div className="text-xs text-muted-foreground">
                        Entrega prevista: {new Date(ordem.venda.data_prevista_entrega).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    {ordem.venda.produtos && ordem.venda.produtos.length > 0 && (
                      <div className="pt-1 border-t border-border/50">
                        <p className="text-[10px] font-medium mb-1.5">Produtos:</p>
                        <div className="space-y-1">
                          {ordem.venda.produtos.map((produto, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                              {produto.cor && (
                                <div 
                                  className="h-2.5 w-2.5 rounded-full border border-border/30 shrink-0 mt-0.5" 
                                  style={{ backgroundColor: produto.cor.codigo_hex }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                {produto.tipo_produto && (
                                  <span className="font-medium">{produto.tipo_produto}</span>
                                )}
                                {(produto.tamanho || (produto.largura && produto.altura)) && (
                                  <span className="text-muted-foreground">
                                    {' • '}
                                    {produto.tamanho || `${produto.largura}x${produto.altura}`}
                                  </span>
                                )}
                                {produto.cor && (
                                  <span className="text-muted-foreground">
                                    {' • '}
                                    {produto.cor.nome}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

    </Card>
  );
};
