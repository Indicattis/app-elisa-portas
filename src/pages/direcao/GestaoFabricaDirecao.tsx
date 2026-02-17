import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, RefreshCw, Factory, Clock, ClipboardCheck, Paintbrush, Wrench, CheckCircle2, FlaskConical, HardHat, AlertTriangle, UserPlus, ShieldCheck } from "lucide-react";
import { CriarPedidoTesteModal } from "@/components/pedidos/CriarPedidoTesteModal";
import { SelecionarResponsavelEtapaModal } from "@/components/pedidos/SelecionarResponsavelEtapaModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { useNeoInstalacoesListagem, useNeoInstalacoesFinalizadas } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoesListagem, useNeoCorrecoesFinalizadas } from "@/hooks/useNeoCorrecoes";
import { useEtapaResponsaveis } from "@/hooks/useEtapaResponsaveis";
import { PedidosDraggableList } from "@/components/pedidos/PedidosDraggableList";
import { PedidosFiltrosMinimalista } from "@/components/pedidos/PedidosFiltrosMinimalista";
import { NeoInstalacaoCardGestao } from "@/components/pedidos/NeoInstalacaoCardGestao";
import { NeoCorrecaoCardGestao } from "@/components/pedidos/NeoCorrecaoCardGestao";
import { NeoInstalacoesDraggableList, NeoCorrecoesDraggableList } from "@/components/pedidos/NeoDraggableList";
import { PortasPorEtapa } from "@/components/producao/dashboard/PortasPorEtapa";
import { ORDEM_ETAPAS, ETAPAS_CONFIG } from "@/types/pedidoEtapa";
import type { EtapaPedido, DirecaoPrioridade } from "@/types/pedidoEtapa";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { GestaoFabricaMobile } from "@/components/direcao/GestaoFabricaMobile";

const ETAPA_ICONS = {
  aberto: Clock,
  aprovacao_ceo: ShieldCheck,
  em_producao: Factory,
  inspecao_qualidade: ClipboardCheck,
  aguardando_pintura: Paintbrush,
  embalagem: Package,
  aguardando_coleta: Package,
  aguardando_instalacao: Wrench,
  instalacoes: HardHat,
  correcoes: AlertTriangle,
  finalizado: CheckCircle2
};

export default function GestaoFabricaDirecao() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>('aberto');
  const [searchTerm, setSearchTerm] = useState('');
  const viewMode = 'list';
  const [tipoEntrega, setTipoEntrega] = useState('todos');
  const [corPintura, setCorPintura] = useState('todas');
  const [mostrarProntos, setMostrarProntos] = useState(false);
  
  const [modalPedidoTesteAberto, setModalPedidoTesteAberto] = useState(false);
  const [modalResponsavelAberto, setModalResponsavelAberto] = useState(false);
  const [etapaParaAtribuir, setEtapaParaAtribuir] = useState<EtapaPedido | null>(null);
  
  const contadores = usePedidosContadores();
  const { neoInstalacoes, concluirNeoInstalacao, isConcluindo, reorganizarNeoInstalacoes } = useNeoInstalacoesListagem();
  const { neoCorrecoes, concluirNeoCorrecao, reorganizarNeoCorrecoes } = useNeoCorrecoesListagem();
  const { neoInstalacoesFinalizadas, retornarNeoInstalacao, isRetornando: isRetornandoInstalacao } = useNeoInstalacoesFinalizadas();
  const { neoCorrecoesFinalizadas, retornarNeoCorrecao, isRetornando: isRetornandoCorrecao } = useNeoCorrecoesFinalizadas();
  const { 
    getResponsavel, 
    atribuirResponsavel, 
    removerResponsavel, 
    isAtribuindo 
  } = useEtapaResponsaveis();
  const {
    pedidos,
    isLoading,
    moverParaProximaEtapa,
    retrocederEtapa,
    atualizarPrioridade,
    reorganizarPedidos,
    arquivarPedido,
    deletarPedido
  } = usePedidosEtapas(etapaAtiva);

  const handleMoverEtapa = async (pedidoId: string, skipCheckboxValidation?: boolean, onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void) => {
    await moverParaProximaEtapa.mutateAsync({
      pedidoId,
      skipCheckboxValidation: skipCheckboxValidation || false,
      onProgress
    });
  };

  const handleRetrocederEtapa = (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => {
    retrocederEtapa.mutate({
      pedidoId,
      etapaDestino,
      motivo
    });
  };

  const handleReorganizar = async (atualizacoes: { id: string; prioridade: number; }[]) => {
    await reorganizarPedidos.mutateAsync(atualizacoes);
  };

  const handleMoverPrioridade = async (pedidoId: string, direcao: DirecaoPrioridade) => {
    const index = pedidos.findIndex(p => p.id === pedidoId);
    if (index === -1) return;
    const pedidoAtual = pedidos[index];
    if (!('numero_pedido' in pedidoAtual)) return;
    
    let novaPrioridade: number;
    if (direcao === 'frente' && index > 0) {
      const anterior = pedidos[index - 1];
      novaPrioridade = ((anterior as any).prioridade_etapa || 0) + 1;
    } else if (direcao === 'tras' && index < pedidos.length - 1) {
      const proximo = pedidos[index + 1];
      novaPrioridade = ((proximo as any).prioridade_etapa || 0) - 1;
    } else {
      return;
    }
    await atualizarPrioridade.mutateAsync({ pedidoId, novaPrioridade });
  };

  const pedidosFiltrados = useMemo(() => {
    let filtered = pedidos;

    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((pedido: any) => {
        const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        const clienteNome = vendaData?.cliente_nome?.toLowerCase() || '';
        const numeroPedido = pedido.numero_pedido?.toString() || '';
        return clienteNome.includes(termo) || numeroPedido.includes(termo);
      });
    }

    if (tipoEntrega !== 'todos') {
      filtered = filtered.filter((pedido: any) => {
        const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        return vendaData?.tipo_entrega === tipoEntrega;
      });
    }

    if (corPintura !== 'todas') {
      filtered = filtered.filter((pedido: any) => {
        const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        const produtos = vendaData?.produtos_vendas || [];
        return produtos.some((p: any) => {
          const corNome = p.cor?.nome || '';
          return corNome.toLowerCase().includes(corPintura.toLowerCase());
        });
      });
    }

    if (mostrarProntos) {
      filtered = filtered.filter((pedido: any) => {
        const etapaAtual = pedido.pedidos_etapas?.find((e: any) => e.etapa === etapaAtiva);
        if (!etapaAtual || !etapaAtual.checkboxes) return false;
        const checkboxes = etapaAtual.checkboxes as any[];
        return checkboxes.filter((cb: any) => cb.required).every((cb: any) => cb.checked === true);
      });
    }
    return filtered;
  }, [pedidos, searchTerm, tipoEntrega, corPintura, mostrarProntos, etapaAtiva]);

  const totalPortasEtapa = useMemo(() => {
    return pedidosFiltrados.reduce((total, pedido: any) => {
      const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
      const produtos = vendaData?.produtos_vendas || [];
      const portasEnrolar = produtos.filter((p: any) => p.tipo_produto === 'porta_enrolar');
      return total + portasEnrolar.reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0);
  }, [pedidosFiltrados]);


  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
    queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_listagem'] });
    queryClient.invalidateQueries({ queryKey: ['neo_correcoes_listagem'] });
    queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_finalizadas'] });
    queryClient.invalidateQueries({ queryKey: ['neo_correcoes_finalizadas'] });
    queryClient.invalidateQueries({ queryKey: ['etapa-responsaveis'] });
    toast({ title: "Atualizado", description: "Lista de pedidos atualizada com sucesso" });
  };

  const handleAbrirModalResponsavel = (etapa: EtapaPedido) => {
    setEtapaParaAtribuir(etapa);
    setModalResponsavelAberto(true);
  };

  const handleAtribuirResponsavel = (userId: string) => {
    if (etapaParaAtribuir) {
      atribuirResponsavel({ etapa: etapaParaAtribuir, responsavelId: userId });
      setModalResponsavelAberto(false);
      setEtapaParaAtribuir(null);
    }
  };

  const handleRemoverResponsavel = () => {
    if (etapaParaAtribuir) {
      removerResponsavel(etapaParaAtribuir);
      setModalResponsavelAberto(false);
      setEtapaParaAtribuir(null);
    }
  };

  const handleConcluirNeoCorrecao = async (id: string) => {
    await concluirNeoCorrecao.mutateAsync(id);
  };

  const handleConcluirNeoInstalacao = async (id: string) => {
    await concluirNeoInstalacao(id);
  };

  const handleRetornarNeoInstalacao = async (id: string) => {
    await retornarNeoInstalacao(id);
  };

  const handleRetornarNeoCorrecao = async (id: string) => {
    await retornarNeoCorrecao(id);
  };

  const handleArquivar = async (pedidoId: string) => {
    await arquivarPedido.mutateAsync(pedidoId);
  };

  const handleDeletarPedido = async (pedidoId: string) => {
    await deletarPedido.mutateAsync(pedidoId);
  };

  const handleAvisoEspera = async (pedidoId: string, justificativa: string | null) => {
    const { error } = await supabase
      .from('pedidos_producao')
      .update({
        aviso_espera: justificativa,
        aviso_espera_data: justificativa ? new Date().toISOString() : null,
        prioridade_etapa: justificativa ? 0 : 1,
      })
      .eq('id', pedidoId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o aviso de espera", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={() => setModalPedidoTesteAberto(true)} 
        size="sm" 
        className="bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
      >
        <FlaskConical className="h-4 w-4 mr-2" />
        Pedido Teste
      </Button>
      <Button variant="outline" onClick={handleRefresh} size="sm" className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isMobile) {
    return <GestaoFabricaMobile />;
  }

  return (
    <MinimalistLayout 
      title="Gestão de Fábrica" 
      subtitle="Acompanhe o progresso dos pedidos"
      backPath="/direcao"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Gestão de Fábrica" }
      ]}
      headerActions={headerActions}
      fullWidth
    >
      {/* Portas por Etapa (Hoje) */}
      <div className="mb-6">
        <PortasPorEtapa />
      </div>

      {/* Tabs de Etapas */}
      <Tabs value={etapaAtiva} onValueChange={v => setEtapaAtiva(v as EtapaPedido)}>
        {/* Seletor mobile */}
        <div className="md:hidden mb-4">
          <Select value={etapaAtiva} onValueChange={v => setEtapaAtiva(v as EtapaPedido)}>
            <SelectTrigger className="w-full h-12 bg-primary/5 border-primary/10 text-white">
              <SelectValue>
                {(() => {
                  const config = ETAPAS_CONFIG[etapaAtiva];
                  const count = contadores[etapaAtiva] || 0;
                  const IconComponent = ETAPA_ICONS[etapaAtiva];
                  return (
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{config.label}</span>
                      <Badge variant="secondary" className="ml-auto bg-primary/10">
                        {count}
                      </Badge>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-primary/10">
              {ORDEM_ETAPAS.map(etapa => {
                const config = ETAPAS_CONFIG[etapa];
                const count = contadores[etapa] || 0;
                const IconComponent = ETAPA_ICONS[etapa];
                return (
                  <SelectItem key={etapa} value={etapa} className="text-white cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{config.label}</span>
                      <Badge variant="secondary" className="text-xs bg-primary/10">
                        {count}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs - Desktop */}
        <TabsList className="hidden md:flex w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 gap-1 bg-primary/5 border border-primary/10">
          <TooltipProvider>
            {ORDEM_ETAPAS.map(etapa => {
              const config = ETAPAS_CONFIG[etapa];
              const count = contadores[etapa] || 0;
              const IconComponent = ETAPA_ICONS[etapa];
              const responsavel = getResponsavel(etapa);
              return (
                <TabsTrigger 
                  key={etapa} 
                  value={etapa} 
                  className="flex-shrink-0 px-2 xs:px-3 py-2 gap-1 xs:gap-1.5 sm:gap-2 text-white/60 data-[state=active]:bg-primary/10 data-[state=active]:text-white"
                >
                  {responsavel ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-5 w-5 border border-primary/30">
                          <AvatarImage src={responsavel.foto_perfil_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/20">
                            {responsavel.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Responsável: {responsavel.nome}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-xs">{config.label}</span>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TooltipProvider>
        </TabsList>

        {ORDEM_ETAPAS.map(etapa => (
          <TabsContent key={etapa} value={etapa} className="mt-4">
            <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl w-full max-w-none">
              <CardHeader className="pb-3 px-4 py-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <span>{ETAPAS_CONFIG[etapa].label}</span>
                    <span className="text-sm font-normal text-white/60">
                      {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                    {totalPortasEtapa > 0 && (
                      <Badge variant="secondary" className="text-xs ml-2 bg-primary/10 text-white">
                        🚪 {totalPortasEtapa} {totalPortasEtapa === 1 ? 'porta' : 'portas'}
                      </Badge>
                    )}
                    
                    {/* Responsável da Etapa */}
                    <div className="flex items-center gap-2 ml-4">
                      {(() => {
                        const responsavel = getResponsavel(etapa);
                        return responsavel ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  onClick={() => handleAbrirModalResponsavel(etapa)}
                                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                >
                                  <Avatar className="h-6 w-6 border border-primary/30">
                                    <AvatarImage src={responsavel.foto_perfil_url || undefined} />
                                    <AvatarFallback className="text-[10px] bg-primary/20">
                                      {responsavel.nome.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-white/80">{responsavel.nome.split(' ')[0]}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Clique para alterar o responsável</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAbrirModalResponsavel(etapa)}
                                  className="h-7 px-2 text-white/50 hover:text-white hover:bg-primary/10"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Atribuir responsável</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  </CardTitle>
                  
                  <PedidosFiltrosMinimalista 
                    searchTerm={searchTerm} 
                    onSearchChange={setSearchTerm} 
                    tipoEntrega={tipoEntrega} 
                    onTipoEntregaChange={setTipoEntrega} 
                    corPintura={corPintura} 
                    onCorPinturaChange={setCorPintura} 
                    mostrarProntos={mostrarProntos} 
                    onMostrarProntosToggle={() => setMostrarProntos(!mostrarProntos)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4">
                {isLoading ? (
                  <div className="text-center py-8 text-white/60">
                    Carregando...
                  </div>
                ) : pedidosFiltrados.length === 0 && !(etapaAtiva === 'instalacoes' && neoInstalacoes.length > 0) && !(etapaAtiva === 'correcoes' && neoCorrecoes.length > 0) ? (
                  <div className="text-center py-8 text-white/60">
                    {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido nesta etapa'}
                  </div>
                ) : (
                  <>
                    {/* Neo Finalizados - apenas na etapa finalizado */}
                    {etapaAtiva === 'finalizado' && (neoInstalacoesFinalizadas.length > 0 || neoCorrecoesFinalizadas.length > 0) && (
                      <div className="mb-4 space-y-2">
                        <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                          <span>Serviços Avulsos Finalizados</span>
                          <span className="text-emerald-400">({neoInstalacoesFinalizadas.length + neoCorrecoesFinalizadas.length})</span>
                          <span className="text-xs text-white/40 ml-auto">últimos 30 dias</span>
                        </h3>
                        <div className="space-y-1">
                          {neoInstalacoesFinalizadas
                            .sort((a, b) => {
                              const dateA = a.concluida_em ? new Date(a.concluida_em).getTime() : 0;
                              const dateB = b.concluida_em ? new Date(b.concluida_em).getTime() : 0;
                              return dateB - dateA;
                            })
                            .map((neo) => (
                              <NeoInstalacaoCardGestao
                                key={neo.id}
                                neoInstalacao={neo}
                                viewMode="list"
                                onConcluir={handleConcluirNeoInstalacao}
                                isConcluindo={isConcluindo}
                                showConcluido
                                onRetornar={handleRetornarNeoInstalacao}
                              />
                            ))}
                          {neoCorrecoesFinalizadas
                            .sort((a, b) => {
                              const dateA = a.concluida_em ? new Date(a.concluida_em).getTime() : 0;
                              const dateB = b.concluida_em ? new Date(b.concluida_em).getTime() : 0;
                              return dateB - dateA;
                            })
                            .map((neo) => (
                              <NeoCorrecaoCardGestao
                                key={neo.id}
                                neoCorrecao={neo}
                                viewMode="list"
                                onConcluir={handleConcluirNeoCorrecao}
                                showConcluido
                                onRetornar={handleRetornarNeoCorrecao}
                              />
                            ))}
                        </div>
                        {pedidosFiltrados.length > 0 && (
                          <h3 className="text-sm font-medium text-white/70 mt-4 mb-2">Pedidos ({pedidosFiltrados.length})</h3>
                        )}
                      </div>
                    )}
                    
                    <PedidosDraggableList
                      pedidos={pedidosFiltrados}
                      pedidosParaTotais={pedidosFiltrados}
                      etapa={etapa} 
                      isAberto={etapa === 'aberto'} 
                      viewMode={viewMode} 
                      onMoverEtapa={handleMoverEtapa} 
                      onRetrocederEtapa={handleRetrocederEtapa} 
                      onReorganizar={handleReorganizar} 
                      onMoverPrioridade={handleMoverPrioridade}
                      onArquivar={handleArquivar}
                      
                      onAvisoEspera={handleAvisoEspera}
                      enableDragAndDrop={true}
                    />

                    {/* Neo Instalações - abaixo dos pedidos normais */}
                    {etapaAtiva === 'instalacoes' && neoInstalacoes.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-medium text-white/70 mb-2">Instalações Avulsas ({neoInstalacoes.length})</h3>
                        <NeoInstalacoesDraggableList
                          neos={neoInstalacoes}
                          viewMode={viewMode}
                          onConcluir={handleConcluirNeoInstalacao}
                          isConcluindo={isConcluindo}
                          onReorganizar={reorganizarNeoInstalacoes}
                        />
                      </div>
                    )}

                    {/* Neo Correções - abaixo dos pedidos normais */}
                    {etapaAtiva === 'correcoes' && neoCorrecoes.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-medium text-white/70 mb-2">Correções Avulsas ({neoCorrecoes.length})</h3>
                        <NeoCorrecoesDraggableList
                          neos={neoCorrecoes}
                          viewMode={viewMode}
                          onConcluir={handleConcluirNeoCorrecao}
                          onReorganizar={reorganizarNeoCorrecoes}
                        />
                      </div>
                    )}
                    
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <CriarPedidoTesteModal
        open={modalPedidoTesteAberto}
        onOpenChange={setModalPedidoTesteAberto}
        onSuccess={() => {
          handleRefresh();
          setModalPedidoTesteAberto(false);
        }}
      />

      {/* Modal para atribuir responsável */}
      {etapaParaAtribuir && (
        <SelecionarResponsavelEtapaModal
          open={modalResponsavelAberto}
          onOpenChange={setModalResponsavelAberto}
          etapa={etapaParaAtribuir}
          responsavelAtualId={getResponsavel(etapaParaAtribuir)?.user_id}
          onConfirm={handleAtribuirResponsavel}
          onRemover={handleRemoverResponsavel}
          isLoading={isAtribuindo}
        />
      )}
    </MinimalistLayout>
  );
}
