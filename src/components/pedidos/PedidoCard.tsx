import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Eye, Package, ChevronUp, ChevronDown, GripVertical, AlertCircle, CheckCircle, ArrowLeft, FileText, Paintbrush, Truck, Hammer, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PedidoDetalhesSheet } from "./PedidoDetalhesSheet";
import { AcaoEtapaModal } from "./AcaoEtapaModal";
import { RetrocederEtapaModal } from "./RetrocederEtapaModal";
import { AvancarQualidadeModal } from "./AvancarQualidadeModal";
import { ConfirmarAvancoModal } from "./ConfirmarAvancoModal";
import { ProcessoAvancoModal, Processo } from "./ProcessoAvancoModal";
import { ConfirmarCarregamentoSheet } from "@/components/entregas/ConfirmarCarregamentoSheet";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa, getEtapaAnterior } from "@/types/pedidoEtapa";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PedidoCardProps {
  pedido: any;
  onMoverEtapa?: (pedidoId: string, skipCheckboxValidation?: boolean, onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void) => void;
  onRetrocederEtapa?: (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => void;
  onMoverPrioridade?: (pedidoId: string, direcao: 'frente' | 'tras') => void;
  isAberto?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  posicao?: number;
  total?: number;
  viewMode?: 'grid' | 'list';
  isSelecionado?: boolean;
  onSelecionarPedido?: (pedido: any) => void;
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
  viewMode = 'grid',
  isSelecionado = false,
  onSelecionarPedido
}: PedidoCardProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showAcaoEtapa, setShowAcaoEtapa] = useState(false);
  const [showRetrocederEtapa, setShowRetrocederEtapa] = useState(false);
  const [showAvancarQualidade, setShowAvancarQualidade] = useState(false);
  const [showConfirmarAvanco, setShowConfirmarAvanco] = useState(false);
  const [showProgresso, setShowProgresso] = useState(false);
  const [showCarregamento, setShowCarregamento] = useState(false);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Verificar se a ordem de pintura está concluída (para etapa aguardando_pintura)
  const { data: ordemPinturaStatus } = useQuery({
    queryKey: ['pedido-pintura-status', pedido.id],
    queryFn: async () => {
      if (pedido.etapa_atual !== 'aguardando_pintura') return null;
      
      const { data: ordemConcluida } = await supabase
        .rpc('verificar_ordem_pintura_concluida', { p_pedido_id: pedido.id });
      
      return ordemConcluida;
    },
    enabled: pedido.etapa_atual === 'aguardando_pintura',
  });

  // Verificar se todos os itens do carregamento foram marcados e se tem data
  const { data: carregamentoCompleto } = useQuery({
    queryKey: ['pedido-carregamento', pedido.id],
    queryFn: async () => {
      if (pedido.etapa_atual !== 'aguardando_coleta' && pedido.etapa_atual !== 'aguardando_instalacao') {
        return { concluido: false, temData: true };
      }
      
      // Verificar se tem data_carregamento
      const { data: pedidoData } = await supabase
        .from('pedidos_producao')
        .select('data_carregamento')
        .eq('id', pedido.id)
        .single();
      
      const temData = !!pedidoData?.data_carregamento;
      
      // Verificar se todos os itens estão marcados
      const { data: linhas } = await supabase
        .from('pedido_linhas')
        .select('check_coleta')
        .eq('pedido_id', pedido.id);
      
      if (!linhas || linhas.length === 0) return { concluido: false, temData };
      const todosMarcados = linhas.every(l => l.check_coleta === true);
      
      return { concluido: todosMarcados && temData, temData };
    },
    enabled: pedido.etapa_atual === 'aguardando_coleta' || pedido.etapa_atual === 'aguardando_instalacao',
  });

  const carregamentoConcluido = carregamentoCompleto?.concluido || false;
  const temDataCarregamento = carregamentoCompleto?.temData || false;

  // Verificar se está em backlog
  const emBacklog = pedido.em_backlog === true;
  const motivoBacklog = pedido.motivo_backlog;

  // Tratar venda como array ou objeto único
  const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  const venda = vendaData;
  
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const config = etapaAtual ? ETAPAS_CONFIG[etapaAtual] : null;
  const proximaEtapa = etapaAtual ? getProximaEtapa(etapaAtual) : null;
  const etapaAnterior = etapaAtual ? getEtapaAnterior(etapaAtual) : null;

  const produtos = venda?.produtos_vendas || [];
  const temLinhas = linhasCount > 0;
  const todasOrdensConcluidasEmProducao = ordensStatus === true;
  const ordemQualidadeConcluida = ordemQualidadeStatus === true;
  const ordemPinturaConcluida = ordemPinturaStatus === true;
  
  // Identificar características do pedido
  const temPintura = produtos.some((p: any) => p.valor_pintura > 0);
  const tipoEntrega = venda?.tipo_entrega;
  const isInstalacao = tipoEntrega === 'instalacao';
  const isEntrega = tipoEntrega === 'entrega';
  
  // Extrair cores únicas dos produtos
  const coresUnicas = Array.from(new Set(
    produtos
      .map((p: any) => p.cor?.nome)
      .filter((cor: string | undefined) => cor !== undefined)
  )) as string[];
  
  // Mapeamento de cores para hex
  const coresMap: Record<string, string> = {
    'Branco': '#FFFFFF',
    'Preto': '#000000',
    'Cinza': '#808080',
    'Azul': '#0000FF',
    'Verde': '#008000',
    'Vermelho': '#FF0000',
    'Amarelo': '#FFFF00',
    'Marrom': '#8B4513',
    'Bege': '#F5F5DC',
    'Rosa': '#FFC0CB',
  };

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
        l.estoque?.setor_responsavel_producao === 'soldagem'
      );
      const temPerfiladeira = linhas?.some(l => 
        l.estoque?.setor_responsavel_producao === 'perfiladeira'
      );
      const temSeparacao = linhas?.some(l => 
        l.estoque?.setor_responsavel_producao === 'separacao'
      );

      // Buscar dados da venda para determinar tipo de entrega
      const { data: pedidoData } = await supabase
        .from('pedidos_producao')
        .select('venda_id')
        .eq('id', pedidoId)
        .single();

      let tipoEntrega = venda?.tipo_entrega;
      if (!tipoEntrega && pedidoData?.venda_id) {
        const { data: vendaData } = await supabase
          .from('vendas')
          .select('tipo_entrega')
          .eq('id', pedidoData.venda_id)
          .single();
        tipoEntrega = vendaData?.tipo_entrega;
      }

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

      if (tipoEntrega === 'instalacao') {
        ordensProcessos.push({ id: 'criar_instalacao', label: 'Criando instalação', status: 'pending' });
      } else if (tipoEntrega === 'entrega') {
        ordensProcessos.push({ id: 'criar_entrega', label: 'Criando entrega', status: 'pending' });
      }

      lista.unshift(...ordensProcessos);
    }

    if (proximaEtapa === 'inspecao_qualidade') {
      lista.unshift({ id: 'criar_ordem_qualidade', label: 'Gerando ordem de qualidade', status: 'pending' });
    }

    if (proximaEtapa === 'aguardando_pintura') {
      lista.unshift({ id: 'criar_ordem_pintura', label: 'Gerando ordem de pintura', status: 'pending' });
    }

    // Se está na etapa de inspeção de qualidade, determinar destino
    if (etapaAtual === 'inspecao_qualidade') {
      // Buscar produtos da venda para verificar se tem pintura
      const { data: produtosComPintura } = await supabase
        .from('produtos_vendas')
        .select('id')
        .eq('venda_id', pedido.venda_id)
        .gt('valor_pintura', 0)
        .limit(1);

      if (produtosComPintura && produtosComPintura.length > 0) {
        // Tem pintura
        lista.push({ 
          id: 'criar_ordem_pintura', 
          label: 'Enviando para pintura', 
          status: 'pending' 
        });
      } else {
        // Não tem pintura - verificar tipo de entrega
        const { data: venda } = await supabase
          .from('vendas')
          .select('tipo_entrega')
          .eq('id', pedido.venda_id)
          .single();

        if (venda?.tipo_entrega === 'entrega') {
          lista.push({ 
            id: 'preparar_coleta', 
            label: 'Enviando para Coleta', 
            status: 'pending' 
          });
        } else {
          lista.push({ 
            id: 'preparar_instalacao', 
            label: 'Enviando para Instalação', 
            status: 'pending' 
          });
        }
      }
    }

    // Se está na etapa aguardando pintura, determinar destino
    if (etapaAtual === 'aguardando_pintura') {
      const { data: venda } = await supabase
        .from('vendas')
        .select('tipo_entrega')
        .eq('id', pedido.venda_id)
        .single();

      if (venda?.tipo_entrega === 'entrega') {
        lista.push({ 
          id: 'preparar_coleta', 
          label: 'Enviando para Coleta', 
          status: 'pending' 
        });
      } else {
        lista.push({ 
          id: 'preparar_instalacao', 
          label: 'Enviando para Instalação', 
          status: 'pending' 
        });
      }
    }

    // Se está na etapa aguardando_coleta, finalizando pedido
    if (etapaAtual === 'aguardando_coleta') {
      lista.push({ 
        id: 'finalizando_pedido', 
        label: 'Finalizando Pedido', 
        status: 'pending' 
      });
    }

    // Se está na etapa aguardando_instalacao, finalizando pedido
    if (etapaAtual === 'aguardando_instalacao') {
      lista.push({ 
        id: 'finalizando_pedido', 
        label: 'Finalizando Pedido', 
        status: 'pending' 
      });
    }

    return lista;
  };

  // Handler para confirmar avanço (após modal de confirmação)
  const handleConfirmarAvanco = async () => {
    setShowConfirmarAvanco(false);
    
    // Se está na etapa aberto, aguardando_pintura, aguardando_coleta ou aguardando_instalacao, usa o sistema de processos
    if (etapaAtual === 'aberto' || etapaAtual === 'aguardando_pintura' || etapaAtual === 'aguardando_coleta' || etapaAtual === 'aguardando_instalacao') {
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
        <Card 
          className={cn(
            "hover:shadow-md transition-all cursor-pointer",
            isDragging && "opacity-50 cursor-grabbing",
            isSelecionado && "ring-2 ring-primary shadow-lg",
            emBacklog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
          )}
          onClick={() => onSelecionarPedido?.(pedido)}
          onDoubleClick={() => navigate(`/dashboard/pedido/${pedido.id}/view`)}
        >
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {emBacklog && (
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 animate-pulse" />
              )}

              {posicao && (
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-semibold flex-shrink-0", getBadgeColor())}>
                  #{posicao}
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
                
                {/* Flags abaixo das informações */}
                {(config || temPintura || isInstalacao || isEntrega) && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {config && (
                      <Badge variant="outline" className={cn(
                        "text-xs px-1.5 py-0",
                        emBacklog ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/50" : "bg-muted/50"
                      )}>
                        {config.label}
                      </Badge>
                    )}
                    
                    {temPintura && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/50">
                        <Paintbrush className="h-3 w-3 mr-1" />
                        Pintura
                      </Badge>
                    )}
                    
                    {isInstalacao && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/50">
                        <Hammer className="h-3 w-3 mr-1" />
                        Instalação
                      </Badge>
                    )}
                    
                    {isEntrega && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                        <Truck className="h-3 w-3 mr-1" />
                        Entrega
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Círculos de cores */}
                {coresUnicas.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {coresUnicas.slice(0, 5).map((cor, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: coresMap[cor] || '#999999' }}
                        title={cor}
                      />
                    ))}
                    {coresUnicas.length > 5 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{coresUnicas.length - 5}
                      </span>
                    )}
                  </div>
                )}
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

              {(() => {
                const actionButtons = [];
                
                // Build action buttons array
                if (isAberto) {
              actionButtons.push(
                <Button
                  key="preparar"
                  size="icon"
                  onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
                  title="Preparar Pedido"
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              );
              if (temLinhas && onMoverEtapa) {
                actionButtons.push(
                  <Button
                    key="iniciar"
                    size="icon"
                    onClick={() => setShowConfirmarAvanco(true)}
                    title="Iniciar Produção"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              }
            } else if (etapaAtual === 'em_producao') {
              actionButtons.push(
                <Button
                  key="avançar-qualidade"
                  size="icon"
                  onClick={() => setShowAvancarQualidade(true)}
                  disabled={!todasOrdensConcluidasEmProducao}
                  title={!todasOrdensConcluidasEmProducao ? "Conclua todas as ordens de produção primeiro" : "Avançar para Qualidade"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'inspecao_qualidade') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={async () => {
                    const processosNecessarios = await determinarProcessos(pedido.id);
                    setProcessos(processosNecessarios);
                    setShowProgresso(true);
                    
                    if (onMoverEtapa) {
                      await onMoverEtapa(pedido.id, true, (processoId, status) => {
                        setProcessos(prev => prev.map(p => 
                          p.id === processoId ? { ...p, status } : p
                        ));
                      });

                      await new Promise(resolve => setTimeout(resolve, 1000));
                      setShowProgresso(false);
                    }
                  }}
                  disabled={!ordemQualidadeConcluida}
                  title={!ordemQualidadeConcluida ? "Conclua todas as inspeções de qualidade primeiro" : "Avançar"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'aguardando_pintura') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={() => setShowConfirmarAvanco(true)}
                  disabled={!ordemPinturaConcluida}
                  title={!ordemPinturaConcluida ? "Conclua a ordem de pintura primeiro" : "Avançar"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'aguardando_coleta' || etapaAtual === 'aguardando_instalacao') {
              actionButtons.push(
                <Button
                  key="carregar"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowCarregamento(true)}
                  title="Carregar"
                >
                  <Package className="h-3.5 w-3.5" />
                </Button>
              );
              if (carregamentoConcluido) {
                actionButtons.push(
                  <Button
                    key="finalizar"
                    size="icon"
                    onClick={() => setShowConfirmarAvanco(true)}
                    title="Finalizar"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              }
            } else if (proximaEtapa && etapaAtual !== 'finalizado') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={() => setShowAcaoEtapa(true)}
                  title="Avançar"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            }

            return (
              <div className="flex items-center gap-1 flex-shrink-0">
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

                {actionButtons.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 ml-2">
                    {actionButtons.map((button) => 
                      React.cloneElement(button, {
                        className: "h-8 w-8"
                      })
                    )}
                  </div>
                )}

                    {!temDataCarregamento && (etapaAtual === 'aguardando_coleta' || etapaAtual === 'aguardando_instalacao') && (
                      <span className="ml-2 text-xs text-warning flex-shrink-0">
                        Defina data de carregamento
                      </span>
                    )}
                  </div>
                );
              })()}
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
          onConfirmar={async () => {
            setShowAvancarQualidade(false);
            
            const listaProcessos = await determinarProcessos(pedido.id);
            setProcessos(listaProcessos);
            setShowProgresso(true);

            if (onMoverEtapa) {
              await onMoverEtapa(pedido.id, false, (processoId, status) => {
                setProcessos(prev => 
                  prev.map(p => p.id === processoId ? { ...p, status } : p)
                );
              });

              await new Promise(resolve => setTimeout(resolve, 1000));
              setShowProgresso(false);
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
          onClose={() => setShowProgresso(false)}
        />
      </>
    );
  }

  // Layout em grid (padrão)
  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-all cursor-pointer",
          isDragging && "opacity-50 cursor-grabbing",
          isSelecionado && "ring-2 ring-primary shadow-lg",
          emBacklog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
        )}
        onClick={() => onSelecionarPedido?.(pedido)}
        onDoubleClick={() => navigate(`/dashboard/pedido/${pedido.id}/view`)}
      >
        <CardContent className="pt-3 pb-2 space-y-2.5">
          {/* Header compacto com controles */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-1">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              {emBacklog && (
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 animate-pulse" />
              )}
            </div>
            
            {/* Controles compactos */}
            <div className="flex items-center gap-0.5">
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
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs truncate">{venda?.cliente_nome}</h3>
              <p className="text-[10px] text-muted-foreground">{venda?.cliente_telefone}</p>
            </div>
            
            {/* Flags e círculos de cores */}
            {(config || temPintura || isInstalacao || isEntrega || coresUnicas.length > 0) && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {config && (
                  <Badge variant="outline" className={cn(
                    "text-[10px] px-1.5 py-0.5",
                    emBacklog ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/50" : "bg-muted/50"
                  )}>
                    {config.label}
                  </Badge>
                )}
                
                {temPintura && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/50">
                    <Paintbrush className="h-2.5 w-2.5 mr-0.5" />
                    Pintura
                  </Badge>
                )}
                {isInstalacao && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/50">
                    <Hammer className="h-2.5 w-2.5 mr-0.5" />
                    Instalação
                  </Badge>
                )}
                {isEntrega && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                    <Truck className="h-2.5 w-2.5 mr-0.5" />
                    Entrega
                  </Badge>
                )}
                
                {/* Círculos de cores */}
                {coresUnicas.length > 0 && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    {coresUnicas.slice(0, 3).map((cor, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: coresMap[cor] || '#999999' }}
                        title={cor}
                      />
                    ))}
                    {coresUnicas.length > 3 && (
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        +{coresUnicas.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
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

        <CardFooter className="pt-0 pb-3">
          {(() => {
            const actionButtons = [];
            
            // Build action buttons array
            if (isAberto) {
              actionButtons.push(
                <Button
                  key="preparar"
                  size="icon"
                  onClick={() => navigate(`/dashboard/pedidos/${pedido.id}/preparacao`)}
                  title="Preparar Pedido"
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              );
              if (temLinhas && onMoverEtapa) {
                actionButtons.push(
                  <Button
                    key="iniciar"
                    size="icon"
                    onClick={() => setShowConfirmarAvanco(true)}
                    title="Iniciar Produção"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              }
            } else if (etapaAtual === 'em_producao') {
              actionButtons.push(
                <Button
                  key="avançar-qualidade"
                  size="icon"
                  onClick={() => setShowAvancarQualidade(true)}
                  disabled={!todasOrdensConcluidasEmProducao}
                  title={!todasOrdensConcluidasEmProducao ? "Conclua todas as ordens de produção primeiro" : "Avançar para Qualidade"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'inspecao_qualidade') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={async () => {
                    const processosNecessarios = await determinarProcessos(pedido.id);
                    setProcessos(processosNecessarios);
                    setShowProgresso(true);
                    
                    if (onMoverEtapa) {
                      await onMoverEtapa(pedido.id, true, (processoId, status) => {
                        setProcessos(prev => prev.map(p => 
                          p.id === processoId ? { ...p, status } : p
                        ));
                      });

                      await new Promise(resolve => setTimeout(resolve, 1000));
                      setShowProgresso(false);
                    }
                  }}
                  disabled={!ordemQualidadeConcluida}
                  title={!ordemQualidadeConcluida ? "Conclua todas as inspeções de qualidade primeiro" : "Avançar"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'aguardando_pintura') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={() => setShowConfirmarAvanco(true)}
                  disabled={!ordemPinturaConcluida}
                  title={!ordemPinturaConcluida ? "Conclua a ordem de pintura primeiro" : "Avançar"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            } else if (etapaAtual === 'aguardando_coleta' || etapaAtual === 'aguardando_instalacao') {
              actionButtons.push(
                <Button
                  key="carregar"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowCarregamento(true)}
                  title="Carregar"
                >
                  <Package className="h-3.5 w-3.5" />
                </Button>
              );
              if (carregamentoConcluido) {
                actionButtons.push(
                  <Button
                    key="finalizar"
                    size="icon"
                    onClick={() => setShowConfirmarAvanco(true)}
                    title="Finalizar"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              }
            } else if (proximaEtapa && etapaAtual !== 'finalizado') {
              actionButtons.push(
                <Button
                  key="avançar"
                  size="icon"
                  onClick={() => setShowAcaoEtapa(true)}
                  title={`Avançar para ${ETAPAS_CONFIG[proximaEtapa].label}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              );
            }

            return (
              <div className="w-full space-y-2">
                {actionButtons.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {actionButtons.map((button) => 
                      React.cloneElement(button, {
                        className: "h-9 w-full"
                      })
                    )}
                  </div>
                )}
                {!temDataCarregamento && (etapaAtual === 'aguardando_coleta' || etapaAtual === 'aguardando_instalacao') && (
                  <span className="text-xs text-warning text-center block">
                    Defina data de carregamento
                  </span>
                )}
              </div>
            );
          })()}
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
        onConfirmar={async () => {
          setShowAvancarQualidade(false);
          
          const listaProcessos = await determinarProcessos(pedido.id);
          setProcessos(listaProcessos);
          setShowProgresso(true);

          if (onMoverEtapa) {
            await onMoverEtapa(pedido.id, false, (processoId, status) => {
              setProcessos(prev => 
                prev.map(p => p.id === processoId ? { ...p, status } : p)
              );
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowProgresso(false);
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
        onClose={() => setShowProgresso(false)}
      />

      <ConfirmarCarregamentoSheet
        entrega={{
          id: pedido.id,
          nome_cliente: venda?.cliente_nome || 'Cliente',
          pedido_id: pedido.id,
          pedido: {
            numero_pedido: pedido.numero_pedido || 'N/A'
          }
        } as any}
        open={showCarregamento}
        onOpenChange={setShowCarregamento}
        onSuccess={async () => {
          setShowCarregamento(false);
          
          // Invalidar queries para atualizar o status do carregamento
          await queryClient.invalidateQueries({ queryKey: ['pedido-carregamento', pedido.id] });
          await queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedido.id] });
          
          toast({
            title: "Carregamento concluído",
            description: "Finalizando pedido...",
          });

          // Avançar automaticamente para "Finalizado"
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
        }}
      />
    </>
  );
}
