import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Eye, Package, ChevronUp, ChevronDown, GripVertical, AlertCircle, CheckCircle, ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PedidoDetalhesSheet } from "./PedidoDetalhesSheet";
import { AcaoEtapaModal } from "./AcaoEtapaModal";
import { RetrocederEtapaModal } from "./RetrocederEtapaModal";
import { AvancarQualidadeModal } from "./AvancarQualidadeModal";
import { ConfirmarAvancoModal } from "./ConfirmarAvancoModal";
import { ProcessoAvancoModal, Processo } from "./ProcessoAvancoModal";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa, getEtapaAnterior } from "@/types/pedidoEtapa";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PedidoCardProps {
  pedido: any;
  onMoverEtapa?: (pedidoId: string, skipCheckboxValidation?: boolean, onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void) => void;
  onRetrocederEtapa?: (pedidoId: string) => void;
  onMoverPrioridade?: (pedidoId: string, direcao: 'frente' | 'tras') => void;
  isAberto?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  posicao?: number;
  total?: number;
  viewMode?: 'grid' | 'list';
}

export function PedidoCard({ 
  pedido, 
  onMoverEtapa,
  onRetrocederEtapa,
  onMoverPrioridade,
  isAberto = false,
  isDragging = false,
  dragHandleProps,
  posicao,
  total,
  viewMode = 'grid'
}: PedidoCardProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showAcaoEtapa, setShowAcaoEtapa] = useState(false);
  const [showRetrocederEtapa, setShowRetrocederEtapa] = useState(false);
  const [showAvancarQualidade, setShowAvancarQualidade] = useState(false);
  const [showConfirmarAvanco, setShowConfirmarAvanco] = useState(false);
  const [showProgresso, setShowProgresso] = useState(false);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Buscar quantidade de linhas do pedido
  const { data: linhasCount = 0 } = useQuery({
    queryKey: ['pedido-linhas-count', pedido.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pedido_linhas')
        .select('*', { count: 'exact', head: true })
        .eq('pedido_id', pedido.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Verificar se todas as ordens de produção estão concluídas (para etapa em_producao)
  const { data: ordensStatus } = useQuery({
    queryKey: ['pedido-ordens-status', pedido.id],
    queryFn: async () => {
      if (pedido.etapa_atual !== 'em_producao') return null;
      
      const { data: todasConcluidas } = await supabase
        .rpc('verificar_ordens_pedido_concluidas', { p_pedido_id: pedido.id });
      
      return todasConcluidas;
    },
    enabled: pedido.etapa_atual === 'em_producao',
  });

  // Verificar se a ordem de qualidade está concluída (para etapa inspecao_qualidade)
  const { data: ordemQualidadeStatus } = useQuery({
    queryKey: ['pedido-qualidade-status', pedido.id],
    queryFn: async () => {
      if (pedido.etapa_atual !== 'inspecao_qualidade') return null;
      
      const { data: todasLinhasConcluidas } = await supabase
        .rpc('verificar_ordem_qualidade_concluida', { p_pedido_id: pedido.id });
      
      return todasLinhasConcluidas;
    },
    enabled: pedido.etapa_atual === 'inspecao_qualidade',
  });

  // Para todos os pedidos (incluindo aberto), buscar dados da venda relacionada
  const venda = pedido.vendas;
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const config = etapaAtual ? ETAPAS_CONFIG[etapaAtual] : null;
  const proximaEtapa = etapaAtual ? getProximaEtapa(etapaAtual) : null;
  const etapaAnterior = etapaAtual ? getEtapaAnterior(etapaAtual) : null;

  const produtos = venda?.produtos_vendas || [];
  const temLinhas = linhasCount > 0;
  const todasOrdensConcluidasEmProducao = ordensStatus === true;
  const ordemQualidadeConcluida = ordemQualidadeStatus === true;

  // Função para determinar processos que serão executados
  const determinarProcessos = async (pedidoId: string) => {
    const lista: Processo[] = [];

    lista.push(
      { id: 'fechar_etapa_atual', label: 'Fechando etapa atual', status: 'pending' },
      { id: 'criar_nova_etapa', label: 'Criando nova etapa', status: 'pending' },
      { id: 'atualizar_pedido', label: 'Atualizando status do pedido', status: 'pending' }
    );

    if (etapaAtual === 'aberto') {
      const { data: linhas } = await supabase
        .from('pedido_linhas')
        .select('*, estoque:estoque_id(setor_responsavel_producao)')
        .eq('pedido_id', pedidoId);

      const temSolda = linhas?.some(l => 
        !l.estoque?.setor_responsavel_producao || 
        l.estoque?.setor_responsavel_producao === 'solda'
      );
      const temPerfiladeira = linhas?.some(l => 
        l.estoque?.setor_responsavel_producao === 'perfiladeira'
      );
      const temSeparacao = linhas?.some(l => 
        l.estoque?.setor_responsavel_producao === 'separacao'
      );

      const ordensProcessos: Processo[] = [];
      if (temPerfiladeira) {
        ordensProcessos.push({ id: 'criar_ordem_perfiladeira', label: 'Criando ordem de perfiladeira', status: 'pending' });
      }
      if (temSolda) {
        ordensProcessos.push({ id: 'criar_ordem_solda', label: 'Criando ordem de solda', status: 'pending' });
      }
      if (temSeparacao) {
        ordensProcessos.push({ id: 'criar_ordem_separacao', label: 'Criando ordem de separação', status: 'pending' });
      }

      if (venda?.tipo_entrega === 'instalacao') {
        ordensProcessos.push({ id: 'criar_instalacao', label: 'Criando instalação', status: 'pending' });
      } else if (venda?.tipo_entrega === 'entrega') {
        ordensProcessos.push({ id: 'criar_entrega', label: 'Criando entrega', status: 'pending' });
      }

      lista.unshift(...ordensProcessos);
    }

    if (proximaEtapa === 'inspecao_qualidade') {
      lista.unshift({ id: 'criar_ordem_qualidade', label: 'Criando ordem de qualidade', status: 'pending' });
    }

    if (proximaEtapa === 'aguardando_pintura') {
      lista.unshift({ id: 'criar_ordem_pintura', label: 'Criando ordem de pintura', status: 'pending' });
    }

    return lista;
  };

  // Handler para confirmar avanço (após modal de confirmação)
  const handleConfirmarAvanco = async () => {
    setShowConfirmarAvanco(false);
    
    const listaProcessos = await determinarProcessos(pedido.id);
    setProcessos(listaProcessos);
    setShowProgresso(true);

    if (onMoverEtapa) {
      await onMoverEtapa(pedido.id, true, (processoId, status) => {
        setProcessos(prev => 
          prev.map(p => p.id === processoId ? { ...p, status } : p)
        );
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowProgresso(false);
    }
  };

  // Badge de posição com cores especiais para top 3
  const getBadgeColor = () => {
    if (!posicao) return "bg-muted text-muted-foreground";
    if (posicao === 1) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
    if (posicao === 2) return "bg-gray-400/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
    if (posicao === 3) return "bg-orange-600/20 text-orange-700 dark:text-orange-400 border-orange-600/50";
    return "bg-muted text-muted-foreground";
  };

  // Layout compacto para visualização em lista
  if (viewMode === 'list') {
    return (
      <>
        <Card className={cn(
          "hover:shadow-md transition-all",
          isDragging && "opacity-50 cursor-grabbing"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {posicao && (
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-semibold flex-shrink-0", getBadgeColor())}>
                  #{posicao}
                </Badge>
              )}

              {config && (
                <Badge className={`${config.color} text-white text-xs px-2 py-0.5 flex-shrink-0`}>
                  {config.label}
                </Badge>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{venda?.cliente_nome}</h3>
                  {!isAberto && pedido.numero_pedido && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {pedido.numero_pedido}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{venda?.cliente_telefone}</span>
                  <span>•</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(venda?.valor_venda || 0)}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(venda?.created_at || Date.now()), "dd/MM/yyyy")}</span>
                </div>
              </div>

              {isAberto && (
                <div className="flex-shrink-0">
                  {temLinhas ? (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {linhasCount}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/50">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Sem linhas
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigate(`/dashboard/pedido/${pedido.id}/view`)}
                  title="Ver página do pedido"
                  className="h-7 w-7"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowDetalhes(true)}
                  title="Ver detalhes"
                  className="h-7 w-7"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                
                {onMoverPrioridade && posicao && total && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={posicao === 1}
                      onClick={() => onMoverPrioridade(pedido.id, 'frente')}
                      title="Aumentar prioridade"
                      className="h-7 w-7"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={posicao === total}
                      onClick={() => onMoverPrioridade(pedido.id, 'tras')}
                      title="Diminuir prioridade"
                      className="h-7 w-7"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                
                {isAdmin && etapaAnterior && onRetrocederEtapa && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setShowRetrocederEtapa(true)}
                    title="Retroceder para etapa anterior"
                    className="h-7 w-7"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                )}

                {isAberto ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
                      className="ml-2"
                    >
                      <FileText className="h-3.5 w-3.5 mr-2" />
                      Preparar
                    </Button>
                    {temLinhas && onMoverEtapa && (
                      <Button
                        size="sm"
                        onClick={() => setShowConfirmarAvanco(true)}
                        className="ml-2"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-2" />
                        Iniciar Produção
                      </Button>
                    )}
                  </>
                ) : etapaAtual === 'em_producao' ? (
                  <Button
                    size="sm"
                    onClick={() => setShowAvancarQualidade(true)}
                    disabled={!todasOrdensConcluidasEmProducao}
                    className="ml-2"
                    title={!todasOrdensConcluidasEmProducao ? "Conclua todas as ordens de produção primeiro" : ""}
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-2" />
                    Avançar para Qualidade
                  </Button>
                ) : etapaAtual === 'inspecao_qualidade' ? (
                  <Button
                    size="sm"
                    onClick={() => setShowAcaoEtapa(true)}
                    disabled={!ordemQualidadeConcluida}
                    className="ml-2"
                    title={!ordemQualidadeConcluida ? "Conclua todas as inspeções de qualidade primeiro" : ""}
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-2" />
                    Avançar
                  </Button>
                ) : proximaEtapa && etapaAtual !== 'finalizado' && (
                  <Button
                    size="sm"
                    onClick={() => setShowAcaoEtapa(true)}
                    className="ml-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-2" />
                    Avançar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <PedidoDetalhesSheet
          pedido={pedido}
          open={showDetalhes}
          onOpenChange={setShowDetalhes}
        />

        <AcaoEtapaModal
          pedido={pedido}
          open={showAcaoEtapa}
          onOpenChange={setShowAcaoEtapa}
          onAvancar={onMoverEtapa || (() => {})}
        />

        <RetrocederEtapaModal
          pedido={pedido}
          open={showRetrocederEtapa}
          onOpenChange={setShowRetrocederEtapa}
          onConfirmar={onRetrocederEtapa || (() => {})}
        />

        <AvancarQualidadeModal
          open={showAvancarQualidade}
          onOpenChange={setShowAvancarQualidade}
          onConfirmar={() => {
            if (onMoverEtapa) {
              onMoverEtapa(pedido.id);
              setShowAvancarQualidade(false);
            }
          }}
        />

        <ConfirmarAvancoModal
          open={showConfirmarAvanco}
          onOpenChange={setShowConfirmarAvanco}
          onConfirmar={handleConfirmarAvanco}
          pedido={pedido}
          etapaAtual={config?.label || ''}
          proximaEtapa={proximaEtapa ? ETAPAS_CONFIG[proximaEtapa].label : ''}
        />

        <ProcessoAvancoModal
          open={showProgresso}
          processos={processos}
        />
      </>
    );
  }

  // Layout em grid (padrão)
  return (
    <>
      <Card className={cn(
        "hover:shadow-md transition-all",
        isDragging && "opacity-50 cursor-grabbing"
      )}>
        <CardContent className="pt-3 pb-2 space-y-2.5">
          {/* Header compacto com controles */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-1">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              {config && (
                <Badge className={`${config.color} text-white text-[10px] px-1.5 py-0.5`}>
                  {config.label}
                </Badge>
              )}
            </div>
            
            {/* Controles compactos */}
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate(`/dashboard/pedido/${pedido.id}/view`)}
                title="Ver página do pedido"
                className="h-6 w-6"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDetalhes(true)}
                title="Ver detalhes"
                className="h-6 w-6"
              >
                <Eye className="h-3 w-3" />
              </Button>
              
              {onMoverPrioridade && posicao && total && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={posicao === 1}
                    onClick={() => onMoverPrioridade(pedido.id, 'frente')}
                    title="Aumentar prioridade"
                    className="h-6 w-6"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={posicao === total}
                    onClick={() => onMoverPrioridade(pedido.id, 'tras')}
                    title="Diminuir prioridade"
                    className="h-6 w-6"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              {isAdmin && etapaAnterior && onRetrocederEtapa && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShowRetrocederEtapa(true)}
                  title="Retroceder para etapa anterior"
                  className="h-6 w-6"
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              )}
              
              {posicao && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 font-semibold ml-0.5", getBadgeColor())}>
                  #{posicao}
                </Badge>
              )}
            </div>
          </div>

          {/* Informações do cliente com background */}
          <div className="bg-muted/30 rounded-md p-2 -mx-2">
            <h3 className="font-semibold text-xs truncate">{venda?.cliente_nome}</h3>
            <p className="text-[10px] text-muted-foreground">{venda?.cliente_telefone}</p>
          </div>

          {/* Status das Linhas do Pedido */}
          {isAberto && (
            <div className="flex items-center gap-2 -mx-2 px-2">
              {temLinhas ? (
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {linhasCount} {linhasCount === 1 ? 'linha' : 'linhas'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Sem linhas
                </Badge>
              )}
            </div>
          )}

          {/* Produtos */}
          {!isAberto && produtos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {produtos.slice(0, 2).map((prod: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  <Package className="h-3 w-3 mr-1" />
                  {prod.tipo_produto}
                </Badge>
              ))}
              {produtos.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{produtos.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Valor e Data */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-primary">
              {formatCurrency(venda?.valor_venda || 0)}
            </span>
            <span className="text-muted-foreground">
              {format(new Date(venda?.created_at || Date.now()), "dd/MM/yyyy")}
            </span>
          </div>

          {/* Número do pedido */}
          {!isAberto && pedido.numero_pedido && (
            <div className="text-xs text-muted-foreground">
              {pedido.numero_pedido}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-3 gap-2 flex-col">
          {isAberto ? (
            <>
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />
                Preparar Pedido
              </Button>
              {temLinhas && onMoverEtapa && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setShowConfirmarAvanco(true)}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                  Iniciar Produção
                </Button>
                     )}
                   </>
                 ) : etapaAtual === 'em_producao' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />
                Ver Preparação
              </Button>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setShowAvancarQualidade(true)}
                disabled={!todasOrdensConcluidasEmProducao}
                title={!todasOrdensConcluidasEmProducao ? "Conclua todas as ordens de produção primeiro" : ""}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                Avançar para Qualidade
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />
                Ver Preparação
              </Button>
              {etapaAtual === 'inspecao_qualidade' ? (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAcaoEtapa(true)}
                  disabled={!ordemQualidadeConcluida}
                  title={!ordemQualidadeConcluida ? "Conclua todas as inspeções de qualidade primeiro" : ""}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                  Avançar para {ETAPAS_CONFIG[proximaEtapa].label}
                </Button>
              ) : proximaEtapa && etapaAtual !== 'finalizado' ? (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAcaoEtapa(true)}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                  Avançar para {ETAPAS_CONFIG[proximaEtapa].label}
                </Button>
              ) : null}
            </>
          )}
        </CardFooter>
      </Card>

      <PedidoDetalhesSheet
        pedido={pedido}
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
      />

      <AcaoEtapaModal
        pedido={pedido}
        open={showAcaoEtapa}
        onOpenChange={setShowAcaoEtapa}
        onAvancar={onMoverEtapa || (() => {})}
      />

      <RetrocederEtapaModal
        pedido={pedido}
        open={showRetrocederEtapa}
        onOpenChange={setShowRetrocederEtapa}
        onConfirmar={onRetrocederEtapa || (() => {})}
      />

      <AvancarQualidadeModal
        open={showAvancarQualidade}
        onOpenChange={setShowAvancarQualidade}
        onConfirmar={() => {
          if (onMoverEtapa) {
            onMoverEtapa(pedido.id);
            setShowAvancarQualidade(false);
          }
        }}
      />

      <ConfirmarAvancoModal
        open={showConfirmarAvanco}
        onOpenChange={setShowConfirmarAvanco}
        onConfirmar={handleConfirmarAvanco}
        pedido={pedido}
        etapaAtual={config?.label || ''}
        proximaEtapa={proximaEtapa ? ETAPAS_CONFIG[proximaEtapa].label : ''}
      />

      <ProcessoAvancoModal
        open={showProgresso}
        processos={processos}
      />
    </>
  );
}
