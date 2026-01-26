import { useState } from "react";
import { Loader2, ClipboardList, Search } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useOrdensPorPedido, OrdemStatus } from "@/hooks/useOrdensPorPedido";
import { PedidoOrdemCard } from "@/components/fabrica/PedidoOrdemCard";
import { OrdemLinhasSheet } from "@/components/fabrica/OrdemLinhasSheet";

type EtapaPedido = 'aberto' | 'em_producao' | 'inspecao_qualidade' | 'pintura' | 'aguardando_coleta';

const ETAPAS: { value: EtapaPedido; label: string }[] = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'inspecao_qualidade', label: 'Inspeção' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'aguardando_coleta', label: 'Coleta' },
];

export default function OrdensPorPedido() {
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>('em_producao');
  const [searchTerm, setSearchTerm] = useState('');
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemStatus | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: pedidos = [], isLoading } = useOrdensPorPedido(etapaAtiva);

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      pedido.numero_pedido.toLowerCase().includes(termo) ||
      pedido.cliente_nome.toLowerCase().includes(termo)
    );
  });

  const handleOrdemClick = (ordem: OrdemStatus) => {
    setOrdemSelecionada(ordem);
    setSheetOpen(true);
  };

  return (
    <MinimalistLayout
      title="Ordens por Pedido"
      subtitle="Visualize as ordens de cada pedido"
      backPath="/fabrica"
      breadcrumbItems={[
        { label: 'Fábrica', path: '/fabrica' },
        { label: 'Ordens por Pedido' }
      ]}
    >
      <div className="space-y-4">
        {/* Barra de busca */}
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar por pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Tabs de etapas */}
        <Tabs value={etapaAtiva} onValueChange={(v) => setEtapaAtiva(v as EtapaPedido)}>
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-x-auto">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50 w-full justify-start">
              {ETAPAS.map((etapa) => (
                <TabsTrigger
                  key={etapa.value}
                  value={etapa.value}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-400"
                >
                  {etapa.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {ETAPAS.map((etapa) => (
            <TabsContent key={etapa.value} value={etapa.value} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <ClipboardList className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhum pedido encontrado nesta etapa.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pedidosFiltrados.map((pedido) => (
                    <PedidoOrdemCard
                      key={pedido.id}
                      pedido={pedido}
                      onOrdemClick={handleOrdemClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Sheet de linhas da ordem */}
      <OrdemLinhasSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </MinimalistLayout>
  );
}
