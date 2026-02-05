import { useState } from "react";
import { PanelLeftClose, PanelLeft, Filter, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { PedidoSidebarItem } from "./PedidoSidebarItem";
import { cn } from "@/lib/utils";

interface CronogramaSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoFiltrado: string | null;
  clienteFiltrado: string | null;
  onPedidoClick: (pedidoId: string | null, clienteNome: string | null) => void;
}

const ABAS_ETAPAS = [
  { value: 'em_producao', label: 'Produção' },
  { value: 'inspecao_qualidade', label: 'Qualidade' },
  { value: 'aguardando_pintura', label: 'Pintura' },
] as const;

export function CronogramaSidebar({ 
  open, 
  onOpenChange, 
  pedidoFiltrado, 
  clienteFiltrado,
  onPedidoClick 
}: CronogramaSidebarProps) {
  const [abaAtiva, setAbaAtiva] = useState<string>('em_producao');

  // Hooks para cada etapa
  const { pedidos: pedidosProducao, isLoading: loadingProducao } = usePedidosEtapas('em_producao');
  const { pedidos: pedidosQualidade, isLoading: loadingQualidade } = usePedidosEtapas('inspecao_qualidade');
  const { pedidos: pedidosPintura, isLoading: loadingPintura } = usePedidosEtapas('aguardando_pintura');

  const pedidosPorEtapa: Record<string, any[]> = {
    em_producao: pedidosProducao,
    inspecao_qualidade: pedidosQualidade,
    aguardando_pintura: pedidosPintura,
  };

  const loadingPorEtapa: Record<string, boolean> = {
    em_producao: loadingProducao,
    inspecao_qualidade: loadingQualidade,
    aguardando_pintura: loadingPintura,
  };

  const handleLimparFiltro = () => {
    onPedidoClick(null, null);
  };

  // Versão recolhida
  if (!open) {
    return (
      <div className="w-10 flex flex-col items-center py-4 bg-zinc-900/50 border-r border-zinc-800">
        <button
          onClick={() => onOpenChange(true)}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Expandir sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        {pedidoFiltrado && (
          <div className="mt-2">
            <Filter className="h-4 w-4 text-blue-400" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-[260px] flex flex-col bg-zinc-900/50 border-r border-zinc-800 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-sm font-semibold text-white">Pedidos</span>
        <button
          onClick={() => onOpenChange(false)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Recolher sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Filtro ativo */}
      {pedidoFiltrado && clienteFiltrado && (
        <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-200 truncate">
                {clienteFiltrado}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparFiltro}
              className="h-6 w-6 p-0 hover:bg-blue-500/20 text-blue-300 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-3 mx-2 mt-2 bg-zinc-800/50 h-8">
          {ABAS_ETAPAS.map((aba) => (
            <TabsTrigger 
              key={aba.value} 
              value={aba.value}
              className="text-[10px] px-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
            >
              {aba.label}
              <Badge 
                variant="secondary" 
                className="ml-1 h-4 px-1 text-[9px] bg-zinc-700/50"
              >
                {pedidosPorEtapa[aba.value]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {ABAS_ETAPAS.map((aba) => (
          <TabsContent 
            key={aba.value} 
            value={aba.value} 
            className="flex-1 mt-0 p-0 min-h-0 data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {loadingPorEtapa[aba.value] ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400" />
                  </div>
                ) : pedidosPorEtapa[aba.value]?.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-xs text-zinc-500">
                    Nenhum pedido
                  </div>
                ) : (
                  pedidosPorEtapa[aba.value]?.map((pedido, index) => {
                    const vendaData = Array.isArray(pedido.vendas) 
                      ? pedido.vendas[0] 
                      : pedido.vendas;
                    
                    return (
                      <PedidoSidebarItem
                        key={pedido.id}
                        pedido={{
                          id: pedido.id,
                          numero_pedido: pedido.numero_pedido,
                          cliente_nome: vendaData?.cliente_nome || 'N/A',
                          prioridade_etapa: pedido.prioridade_etapa || 0,
                          tipo_entrega: vendaData?.tipo_entrega,
                        }}
                        posicao={index + 1}
                        isSelected={pedidoFiltrado === pedido.id}
                        onClick={() => {
                          const clienteNome = vendaData?.cliente_nome || 'N/A';
                          onPedidoClick(
                            pedidoFiltrado === pedido.id ? null : pedido.id,
                            pedidoFiltrado === pedido.id ? null : clienteNome
                          );
                        }}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
