import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw, Search, Factory, CheckCircle, Paintbrush, Truck, HardHat, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { supabase } from "@/integrations/supabase/client";


const ITEMS_PER_PAGE = 25;

interface EtapaConfig {
  id: EtapaPedido;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const ETAPAS_CONFIG: EtapaConfig[] = [
  { 
    id: 'aberto', 
    label: 'Pedidos em Aberto', 
    shortLabel: 'Aberto',
    icon: Package, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20' 
  },
  { 
    id: 'aprovacao_ceo' as EtapaPedido, 
    label: 'Aprovação CEO', 
    shortLabel: 'Aprovação',
    icon: ShieldCheck, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20' 
  },
  { 
    id: 'em_producao', 
    label: 'Em Produção', 
    shortLabel: 'Produção',
    icon: Factory, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20' 
  },
  { 
    id: 'inspecao_qualidade', 
    label: 'Inspeção de Qualidade', 
    shortLabel: 'Qualidade',
    icon: CheckCircle, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20' 
  },
  { 
    id: 'aguardando_pintura', 
    label: 'Aguardando Pintura', 
    shortLabel: 'Pintura',
    icon: Paintbrush, 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500/20' 
  },
  { 
    id: 'embalagem', 
    label: 'Embalagem', 
    shortLabel: 'Embalagem',
    icon: Package, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20' 
  },
  { 
    id: 'aguardando_coleta', 
    label: 'Expedição Coleta', 
    shortLabel: 'Coleta',
    icon: Truck, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20' 
  },
  { 
    id: 'instalacoes', 
    label: 'Instalações', 
    shortLabel: 'Instalações',
    icon: HardHat, 
    color: 'text-teal-400', 
    bgColor: 'bg-teal-500/20' 
  },
  { 
    id: 'correcoes', 
    label: 'Correções', 
    shortLabel: 'Correções',
    icon: AlertTriangle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20' 
  },
  { 
    id: 'finalizado', 
    label: 'Finalizados', 
    shortLabel: 'Finalizado',
    icon: CheckCircle2, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20' 
  },
];

export default function PedidosAdminMinimalista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState<string>("aberto");
  const [currentPages, setCurrentPages] = useState<Record<string, number>>({});
  
  // Hooks para cada etapa
  const { 
    pedidos: pedidosAberto, 
    isLoading: isLoadingAberto,
    moverParaProximaEtapa,
    retrocederEtapa,
    deletarPedido
  } = usePedidosEtapas("aberto");
  const { pedidos: pedidosAprovacao, isLoading: isLoadingAprovacao } = usePedidosEtapas("aprovacao_ceo");
  const { pedidos: pedidosProducao, isLoading: isLoadingProducao } = usePedidosEtapas("em_producao");
  const { pedidos: pedidosQualidade, isLoading: isLoadingQualidade } = usePedidosEtapas("inspecao_qualidade");
  const { pedidos: pedidosPintura, isLoading: isLoadingPintura } = usePedidosEtapas("aguardando_pintura");
  const { pedidos: pedidosEmbalagem, isLoading: isLoadingEmbalagem } = usePedidosEtapas("embalagem");
  const { pedidos: pedidosColeta, isLoading: isLoadingColeta } = usePedidosEtapas("aguardando_coleta");
  const { pedidos: pedidosInstalacoes, isLoading: isLoadingInstalacoes } = usePedidosEtapas("instalacoes");
  const { pedidos: pedidosCorrecoes, isLoading: isLoadingCorrecoes } = usePedidosEtapas("correcoes");
  const { pedidos: pedidosFinalizados, isLoading: isLoadingFinalizados } = usePedidosEtapas("finalizado");

  // Mapeamento de pedidos e loading por etapa
  const pedidosPorEtapa: Record<string, any[]> = {
    aberto: pedidosAberto,
    aprovacao_ceo: pedidosAprovacao,
    em_producao: pedidosProducao,
    inspecao_qualidade: pedidosQualidade,
    aguardando_pintura: pedidosPintura,
    embalagem: pedidosEmbalagem,
    aguardando_coleta: pedidosColeta,
    instalacoes: pedidosInstalacoes,
    correcoes: pedidosCorrecoes,
    finalizado: pedidosFinalizados,
  };

  const loadingPorEtapa: Record<string, boolean> = {
    aberto: isLoadingAberto,
    aprovacao_ceo: isLoadingAprovacao,
    em_producao: isLoadingProducao,
    inspecao_qualidade: isLoadingQualidade,
    aguardando_pintura: isLoadingPintura,
    embalagem: isLoadingEmbalagem,
    aguardando_coleta: isLoadingColeta,
    instalacoes: isLoadingInstalacoes,
    correcoes: isLoadingCorrecoes,
    finalizado: isLoadingFinalizados,
  };

  // Handler para avançar etapa
  const handleMoverEtapa = async (
    pedidoId: string, 
    skipCheckboxValidation?: boolean,
    onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void
  ) => {
    try {
      await moverParaProximaEtapa.mutateAsync({ 
        pedidoId, 
        skipCheckboxValidation,
        onProgress 
      });
      toast({
        title: "Sucesso",
        description: "Pedido avançado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao avançar pedido",
        variant: "destructive"
      });
    }
  };

  // Handler para retroceder etapa
  const handleRetrocederEtapa = async (
    pedidoId: string, 
    etapaDestino: EtapaPedido, 
    motivo: string
  ) => {
    try {
      await retrocederEtapa.mutateAsync({ pedidoId, etapaDestino, motivo });
      toast({
        title: "Sucesso", 
        description: "Pedido retrocedido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao retroceder pedido",
        variant: "destructive"
      });
    }
  };

  // Handler para excluir pedido
  const handleDeletarPedido = async (pedidoId: string) => {
    try {
      await deletarPedido.mutateAsync(pedidoId);
      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir pedido",
        variant: "destructive"
      });
    }
  };

  // Handler para aviso de espera
  const handleAvisoEspera = async (pedidoId: string, justificativa: string | null) => {
    try {
      const updateData: any = {
        aviso_espera: justificativa,
        aviso_espera_data: justificativa ? new Date().toISOString() : null,
      };
      // Se registrando aviso, mover para última posição (prioridade 0)
      // Se removendo, restaurar prioridade mínima (1)
      if (justificativa) {
        updateData.prioridade_etapa = 0;
      } else {
        updateData.prioridade_etapa = 1;
      }

      const { error } = await supabase
        .from('pedidos_producao')
        .update(updateData)
        .eq('id', pedidoId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      toast({
        title: justificativa ? "Aviso registrado" : "Aviso removido",
        description: justificativa 
          ? "Pedido movido para a última posição" 
          : "Aviso de espera removido",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar aviso de espera",
        variant: "destructive"
      });
    }
  };

  // Filtrar pedidos por etapa
  const filtrarPedidos = (pedidos: any[]) => {
    let filtrados = pedidos;

    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.numero_pedido?.toLowerCase().includes(termo) ||
          p.vendas?.cliente_nome?.toLowerCase().includes(termo)
      );
    }

    if (tipoEntrega !== "todos") {
      filtrados = filtrados.filter((p) => p.vendas?.tipo_entrega === tipoEntrega);
    }

    return filtrados;
  };

  // Calcular total de portas
  const calcularTotalPortas = (pedidos: any[]) => {
    return pedidos.reduce((total, pedido) => {
      const produtos = (pedido.vendas as any)?.produtos_vendas as any[] | undefined;
      if (!produtos) return total;
      
      const portasEnrolar = produtos.filter((p: any) => 
        p.categoria_produto === "porta_enrolar" || p.tipo_produto === "porta_enrolar"
      );
      
      return total + portasEnrolar.reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0);
  };

  // Pedidos filtrados por etapa
  const pedidosFiltradosPorEtapa = useMemo(() => {
    const resultado: Record<string, any[]> = {};
    for (const etapa of ETAPAS_CONFIG) {
      resultado[etapa.id] = filtrarPedidos(pedidosPorEtapa[etapa.id] || []);
    }
    return resultado;
  }, [pedidosPorEtapa, searchTerm, tipoEntrega]);

  // Gerar páginas para paginação
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pedidos-etapas"] });
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    });
  };

  // Contar total de pedidos ativos (excluindo finalizados)
  const totalPedidosAtivos = ETAPAS_CONFIG
    .filter(e => e.id !== 'finalizado')
    .reduce((sum, etapa) => sum + (pedidosFiltradosPorEtapa[etapa.id]?.length || 0), 0);

  // Renderizar conteúdo de uma etapa
  const renderEtapaContent = (etapaConfig: EtapaConfig) => {
    const pedidosFiltrados = pedidosFiltradosPorEtapa[etapaConfig.id] || [];
    const isLoading = loadingPorEtapa[etapaConfig.id];
    const currentPage = currentPages[etapaConfig.id] || 1;
    const totalPages = Math.ceil(pedidosFiltrados.length / ITEMS_PER_PAGE);
    const pedidosPaginados = pedidosFiltrados.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    const totalPortas = calcularTotalPortas(pedidosFiltrados);
    const Icon = etapaConfig.icon;

    return (
      <Card className="bg-primary/5 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${etapaConfig.color}`} />
              <span>{etapaConfig.label}</span>
              <span className="text-sm font-normal text-white/60">
                ({pedidosFiltrados.length} pedidos • {totalPortas} portas)
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${etapaConfig.color.replace('text-', 'border-')}`} />
            </div>
          ) : pedidosPaginados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/60">
              <Icon className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum pedido encontrado nesta etapa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosPaginados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  isAberto={etapaConfig.id === 'aberto'}
                  viewMode="list"
                  onMoverEtapa={handleMoverEtapa}
                  onRetrocederEtapa={handleRetrocederEtapa}
                  onDeletar={etapaConfig.id === 'aberto' ? handleDeletarPedido : undefined}
                  onAvisoEspera={handleAvisoEspera}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPages(prev => ({
                        ...prev,
                        [etapaConfig.id]: Math.max(1, currentPage - 1)
                      }))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers(currentPage, totalPages).map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPages(prev => ({
                            ...prev,
                            [etapaConfig.id]: page as number
                          }))}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPages(prev => ({
                        ...prev,
                        [etapaConfig.id]: Math.min(totalPages, currentPage + 1)
                      }))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MinimalistLayout 
      title="Pedidos" 
      subtitle={`${totalPedidosAtivos} pedidos ativos`}
      backPath="/administrativo"
      fullWidth
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Pedidos" }
      ]}
    >
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pedidos</h2>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Filtros globais */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar por cliente ou número..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPages({});
            }}
            className="pl-10 bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
          />
        </div>
        <Select 
          value={tipoEntrega} 
          onValueChange={(value) => {
            setTipoEntrega(value);
            setCurrentPages({});
          }}
        >
          <SelectTrigger className="w-[160px] bg-primary/5 border-primary/10 text-white">
            <SelectValue placeholder="Tipo de entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="instalacao">Instalação</SelectItem>
            <SelectItem value="entrega">Entrega</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* Tabs para alternar entre etapas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex w-max mb-4 bg-primary/5 border border-primary/10 p-1">
            {ETAPAS_CONFIG.map((etapa) => {
              const Icon = etapa.icon;
              const count = pedidosFiltradosPorEtapa[etapa.id]?.length || 0;
              return (
                <TabsTrigger 
                  key={etapa.id}
                  value={etapa.id} 
                  className={`data-[state=active]:${etapa.bgColor} data-[state=active]:${etapa.color} px-3`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">{etapa.shortLabel}</span>
                  <span className="ml-1.5 text-xs opacity-70">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Conteúdo de cada tab */}
        {ETAPAS_CONFIG.map((etapa) => (
          <TabsContent key={etapa.id} value={etapa.id}>
            {renderEtapaContent(etapa)}
          </TabsContent>
        ))}
      </Tabs>
    </MinimalistLayout>
  );
}
