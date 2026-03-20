import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Factory, Clock, ClipboardCheck, Paintbrush, Wrench, CheckCircle2, HardHat, AlertTriangle, ShieldCheck, Archive, ChevronDown, Loader2 } from "lucide-react";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useItensNaoConcluidosPorEtapa } from "@/hooks/useItensNaoConcluidosPorEtapa";
import { ORDEM_ETAPAS } from "@/types/pedidoEtapa";
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
  const { itens, isLoading: isLoadingItens } = useItensNaoConcluidosPorEtapa();

  const itensAgrupadosPorEtapa = useMemo(() => {
    const parseTamanho = (t: string | null): number => {
      if (!t) return 0;
      const val = parseFloat(t.replace(',', '.'));
      return isNaN(val) ? 0 : val;
    };
    const porEtapa: Record<string, Record<string, { nome: string; quantidadeTotal: number; tamanhoTotal: number; pedidos: Set<number> }>> = {};
    for (const item of itens) {
      const etapa = item.etapa_atual || "sem_etapa";
      const nome = item.estoque_nome || item.nome_produto;
      if (!porEtapa[etapa]) porEtapa[etapa] = {};
      if (!porEtapa[etapa][nome]) porEtapa[etapa][nome] = { nome, quantidadeTotal: 0, tamanhoTotal: 0, pedidos: new Set() };
      porEtapa[etapa][nome].quantidadeTotal += item.quantidade;
      const tamanho = parseTamanho(item.tamanho);
      porEtapa[etapa][nome].tamanhoTotal += tamanho * item.quantidade;
      if (item.pedido_numero) porEtapa[etapa][nome].pedidos.add(item.pedido_numero);
    }
    return porEtapa;
  }, [itens]);

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
      {/* Seção: Itens Pendentes por Etapa */}
      <div>
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
                                   <TableCell className="text-white text-sm text-right">{grupo.tamanhoTotal > 0 ? `${grupo.tamanhoTotal.toFixed(2)}m` : "-"}</TableCell>
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