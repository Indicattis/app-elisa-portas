import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Factory, Clock, ClipboardCheck, Paintbrush, Wrench, CheckCircle2, HardHat, AlertTriangle, ShieldCheck, Archive, Search, ChevronDown, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { PedidosDraggableList } from "@/components/pedidos/PedidosDraggableList";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { useEtapaResponsaveis } from "@/hooks/useEtapaResponsaveis";
import { useItensNaoConcluidosPorEtapa } from "@/hooks/useItensNaoConcluidosPorEtapa";
import { ORDEM_ETAPAS, ETAPAS_CONFIG } from "@/types/pedidoEtapa";
import type { EtapaPedido } from "@/types/pedidoEtapa";

const ETAPA_ICONS: Record<string, any> = {
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
  finalizado: CheckCircle2,
  arquivo_morto: Archive,
};

const ETAPA_LABELS: Record<string, string> = {
  aberto: "Aberto",
  aprovacao_ceo: "Aprov. CEO",
  em_producao: "Em Produção",
  inspecao_qualidade: "Qualidade",
  aguardando_pintura: "Pintura",
  embalagem: "Embalagem",
  aguardando_coleta: "Ag. Coleta",
  instalacoes: "Instalações",
  correcoes: "Correções",
  finalizado: "Finalizado",
};

export default function ProducaoAdminReadOnly() {
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>("aberto");
  const [searchTerm, setSearchTerm] = useState("");

  const contadores = usePedidosContadores();
  const { pedidos, isLoading } = usePedidosEtapas(etapaAtiva);
  const { getResponsavel } = useEtapaResponsaveis();
  const { itensPorEtapa, itens, isLoading: isLoadingItens } = useItensNaoConcluidosPorEtapa();

  const pedidosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return pedidos;
    const termo = searchTerm.toLowerCase().trim();
    return pedidos.filter((pedido: any) => {
      const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
      const clienteNome = vendaData?.cliente_nome?.toLowerCase() || "";
      const numeroPedido = pedido.numero_pedido?.toString() || "";
      return clienteNome.includes(termo) || numeroPedido.includes(termo);
    });
  }, [pedidos, searchTerm]);

  // Agrupar itens por etapa, e dentro de cada etapa agrupar por nome do item
  const itensAgrupadosPorEtapa = useMemo(() => {
    const porEtapa: Record<string, Record<string, { nome: string; quantidadeTotal: number; tamanhoTotal: number; pedidos: Set<number> }>> = {};
    for (const item of itens) {
      const etapa = item.etapa_atual || "sem_etapa";
      const nome = item.estoque_nome || item.item;
      if (!porEtapa[etapa]) porEtapa[etapa] = {};
      if (!porEtapa[etapa][nome]) porEtapa[etapa][nome] = { nome, quantidadeTotal: 0, tamanhoTotal: 0, pedidos: new Set() };
      porEtapa[etapa][nome].quantidadeTotal += item.quantidade;
      let area = 0;
      if (item.largura && item.altura) {
        area = item.largura * item.altura;
      } else if (item.tamanho) {
        const match = item.tamanho.match(/(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)/);
        if (match) {
          area = parseFloat(match[1].replace(',', '.')) * parseFloat(match[2].replace(',', '.'));
        }
      }
      porEtapa[etapa][nome].tamanhoTotal += area * item.quantidade;
      if (item.pedido_numero) porEtapa[etapa][nome].pedidos.add(item.pedido_numero);
    }
    return porEtapa;
  }, [itens]);

  // no-op handlers required by PedidosDraggableList
  const noopReorganizar = async () => {};
  const noopMoverPrioridade = () => {};

  return (
    <MinimalistLayout
      title="Produção"
      subtitle="Visualização dos pedidos por etapa"
      backPath="/administrativo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Produção" },
      ]}
      fullWidth
    >
      {/* Tabs de Etapas */}
      <Tabs value={etapaAtiva} onValueChange={(v) => setEtapaAtiva(v as EtapaPedido)}>
        {/* Mobile selector */}
        <div className="md:hidden mb-4">
          <Select value={etapaAtiva} onValueChange={(v) => setEtapaAtiva(v as EtapaPedido)}>
            <SelectTrigger className="w-full h-12 bg-white/5 border-blue-500/10 text-white">
              <SelectValue>
                {(() => {
                  const config = ETAPAS_CONFIG[etapaAtiva];
                  const count = contadores[etapaAtiva] || 0;
                  const IconComp = ETAPA_ICONS[etapaAtiva];
                  return (
                    <div className="flex items-center gap-2">
                      <IconComp className="h-5 w-5" />
                      <span className="font-medium">{config.label}</span>
                      <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-400">{count}</Badge>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-blue-500/10">
              {ORDEM_ETAPAS.map((etapa) => {
                const config = ETAPAS_CONFIG[etapa];
                const count = contadores[etapa] || 0;
                const IconComp = ETAPA_ICONS[etapa];
                return (
                  <SelectItem key={etapa} value={etapa} className="text-white cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <IconComp className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{config.label}</span>
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">{count}</Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop tabs with colored groups */}
        <TabsList className="hidden md:flex w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 gap-2 bg-white/5 border border-blue-500/10">
          <TooltipProvider>
            {/* Grupo Vermelho: Produção */}
            <div className="flex gap-1 border-2 border-red-500/50 rounded-lg p-1">
              {(["aberto", "aprovacao_ceo", "em_producao", "inspecao_qualidade", "aguardando_pintura", "embalagem"] as const).map((etapa) => {
                const config = ETAPAS_CONFIG[etapa];
                const count = contadores[etapa] || 0;
                const IconComp = ETAPA_ICONS[etapa];
                const responsavel = getResponsavel(etapa);
                return (
                  <TabsTrigger key={etapa} value={etapa} className="flex-shrink-0 px-2 py-2 gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    {responsavel ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-5 w-5 border border-blue-500/30">
                            <AvatarImage src={responsavel.foto_perfil_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-blue-500/20">{responsavel.nome.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Responsável: {responsavel.nome}</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <IconComp className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-xs">{config.label}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">{count}</span>
                  </TabsTrigger>
                );
              })}
            </div>

            {/* Grupo Amarelo: Expedição */}
            <div className="flex gap-1 border-2 border-yellow-500/50 rounded-lg p-1">
              {(["aguardando_coleta", "instalacoes", "correcoes"] as const).map((etapa) => {
                const config = ETAPAS_CONFIG[etapa];
                const count = contadores[etapa] || 0;
                const IconComp = ETAPA_ICONS[etapa];
                const responsavel = getResponsavel(etapa);
                return (
                  <TabsTrigger key={etapa} value={etapa} className="flex-shrink-0 px-2 py-2 gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    {responsavel ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-5 w-5 border border-blue-500/30">
                            <AvatarImage src={responsavel.foto_perfil_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-blue-500/20">{responsavel.nome.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Responsável: {responsavel.nome}</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <IconComp className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-xs">{config.label}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">{count}</span>
                  </TabsTrigger>
                );
              })}
            </div>

            {/* Grupo Verde: Finalizado */}
            <div className="flex gap-1 border-2 border-green-500/50 rounded-lg p-1">
              {(["finalizado"] as const).map((etapa) => {
                const config = ETAPAS_CONFIG[etapa];
                const count = contadores[etapa] || 0;
                const IconComp = ETAPA_ICONS[etapa];
                return (
                  <TabsTrigger key={etapa} value={etapa} className="flex-shrink-0 px-2 py-2 gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                    <IconComp className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">{config.label}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">{count}</span>
                  </TabsTrigger>
                );
              })}
            </div>
          </TooltipProvider>
        </TabsList>

        {ORDEM_ETAPAS.map((etapa) => (
          <TabsContent key={etapa} value={etapa} className="mt-4">
            <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl w-full max-w-none">
              <CardHeader className="pb-3 px-4 py-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <span>{ETAPAS_CONFIG[etapa].label}</span>
                    <span className="text-sm font-normal text-white/60">
                      {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"}
                    </span>
                  </CardTitle>
                  <div className="relative w-full lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Buscar pedido..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white/5 border-blue-500/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4">
                {isLoading ? (
                  <div className="text-center py-8 text-white/60">Carregando...</div>
                ) : pedidosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    {searchTerm ? "Nenhum pedido encontrado" : "Nenhum pedido nesta etapa"}
                  </div>
                ) : (
                  <PedidosDraggableList
                    pedidos={pedidosFiltrados}
                    pedidosParaTotais={pedidosFiltrados}
                    etapa={etapa}
                    isAberto={etapa === "aberto"}
                    viewMode="list"
                    onReorganizar={noopReorganizar}
                    onMoverPrioridade={noopMoverPrioridade}
                    enableDragAndDrop={false}
                    showPosicao={true}
                    disableClienteClick={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Seção: Itens Não Concluídos por Etapa */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Itens Pendentes por Etapa</h2>
        {isLoadingItens ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(itensAgrupadosPorEtapa).length === 0 ? (
          <p className="text-white/60 text-center py-8">Nenhum item pendente encontrado.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(itensAgrupadosPorEtapa)
              .sort(([a], [b]) => {
                const orderA = ORDEM_ETAPAS.indexOf(a as EtapaPedido);
                const orderB = ORDEM_ETAPAS.indexOf(b as EtapaPedido);
                return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
              })
              .map(([etapa, itensMap]) => {
                const label = ETAPA_LABELS[etapa] || etapa;
                const IconComp = ETAPA_ICONS[etapa] || Package;
                const listaItens = Object.values(itensMap).sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);
                const totalItens = listaItens.reduce((s, i) => s + i.quantidadeTotal, 0);
                return (
                  <Collapsible key={etapa}>
                    <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2 text-white">
                            <IconComp className="h-4 w-4" />
                            <span className="font-medium text-sm">{label}</span>
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                              {listaItens.length} {listaItens.length === 1 ? "item" : "itens"} · {totalItens} un.
                            </Badge>
                          </div>
                          <ChevronDown className="h-4 w-4 text-white/40 transition-transform duration-200" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-blue-500/10 hover:bg-white/5">
                                <TableHead className="text-white/70">Item</TableHead>
                                 <TableHead className="text-white/70 text-right">Qtd Total</TableHead>
                                 <TableHead className="text-white/70 text-right">Tamanho Total</TableHead>
                                 <TableHead className="text-white/70">Pedidos</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {listaItens.map((grupo) => (
                                <TableRow key={grupo.nome} className="border-blue-500/10 hover:bg-white/5">
                                  <TableCell className="text-white text-sm font-medium">{grupo.nome}</TableCell>
                                   <TableCell className="text-white text-sm text-right font-semibold">{grupo.quantidadeTotal}</TableCell>
                                   <TableCell className="text-white text-sm text-right">{grupo.tamanhoTotal > 0 ? `${grupo.tamanhoTotal.toFixed(2)}m²` : "-"}</TableCell>
                                   <TableCell className="text-white/60 text-sm">
                                    {Array.from(grupo.pedidos).sort((a, b) => a - b).map(n => `#${n}`).join(", ")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
