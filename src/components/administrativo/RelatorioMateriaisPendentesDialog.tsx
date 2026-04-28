import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  ArrowLeft,
  FileDown,
  ClipboardList,
  Package,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useMateriaisPendentesPorEtapa,
  type MaterialConsolidado,
} from "@/hooks/useMateriaisPendentesPorEtapa";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { gerarRelatorioMateriaisPDF } from "@/utils/relatorioMateriaisPDF";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ETAPAS_DISPONIVEIS: { id: EtapaPedido; label: string }[] = [
  { id: "aberto", label: "Aberto" },
  { id: "aprovacao_ceo" as EtapaPedido, label: "Aprovação CEO" },
  { id: "em_producao", label: "Em Produção" },
  { id: "inspecao_qualidade", label: "Inspeção de Qualidade" },
  { id: "aguardando_pintura", label: "Aguardando Pintura" },
  { id: "embalagem", label: "Embalagem" },
  { id: "aguardando_coleta", label: "Expedição/Coleta" },
];

const ETAPA_LABEL: Record<string, string> = Object.fromEntries(
  ETAPAS_DISPONIVEIS.map((e) => [e.id, e.label])
);

type Step = "filtros" | "selecao" | "relatorio";

export function RelatorioMateriaisPendentesDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const {
    pedidosComPendencias,
    isLoadingPedidos,
    fetchPedidosComPendencias,
    consolidarMateriais,
    reset,
  } = useMateriaisPendentesPorEtapa();

  const [step, setStep] = useState<Step>("filtros");
  const [etapasSelecionadas, setEtapasSelecionadas] = useState<EtapaPedido[]>([
    "em_producao",
  ]);
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Set<string>>(new Set());
  const [relatorio, setRelatorio] = useState<MaterialConsolidado[]>([]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep("filtros");
      setPedidosSelecionados(new Set());
      setRelatorio([]);
      reset();
    }
    onOpenChange(next);
  };

  const toggleEtapa = (etapa: EtapaPedido) => {
    setEtapasSelecionadas((prev) =>
      prev.includes(etapa) ? prev.filter((e) => e !== etapa) : [...prev, etapa]
    );
  };

  const handleBuscar = async () => {
    if (etapasSelecionadas.length === 0) {
      toast({ title: "Selecione ao menos uma etapa", variant: "destructive" });
      return;
    }
    const result = await fetchPedidosComPendencias(etapasSelecionadas);
    setStep("selecao");
    // Pré-selecionar todos
    setPedidosSelecionados(new Set(result.map((p) => p.pedido_id)));
  };

  const todosSelecionados =
    pedidosComPendencias.length > 0 &&
    pedidosSelecionados.size === pedidosComPendencias.length;

  const toggleTodos = () => {
    if (todosSelecionados) {
      setPedidosSelecionados(new Set());
    } else {
      setPedidosSelecionados(new Set(pedidosComPendencias.map((p) => p.pedido_id)));
    }
  };

  const togglePedido = (id: string) => {
    setPedidosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGerarRelatorio = () => {
    if (pedidosSelecionados.size === 0) {
      toast({ title: "Selecione ao menos um pedido", variant: "destructive" });
      return;
    }
    const consolidado = consolidarMateriais(Array.from(pedidosSelecionados));
    setRelatorio(consolidado);
    setStep("relatorio");
  };

  const handleExportPDF = () => {
    const doc = gerarRelatorioMateriaisPDF({
      materiais: relatorio,
      totalPedidos: pedidosSelecionados.size,
      etapas: etapasSelecionadas.map((e) => ETAPA_LABEL[e] || e),
    });
    doc.save(`materiais-pendentes-${Date.now()}.pdf`);
  };

  const totalGeralFaltante = useMemo(
    () => relatorio.reduce((s, m) => s + m.faltante, 0),
    [relatorio]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-zinc-950 border-white/10 text-white p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            Relatório de Materiais Pendentes
          </DialogTitle>
          <div className="flex items-center gap-2 mt-3">
            <StepIndicator active={step === "filtros"} done={step !== "filtros"} label="1. Etapas" />
            <div className="h-px flex-1 bg-white/10" />
            <StepIndicator
              active={step === "selecao"}
              done={step === "relatorio"}
              label="2. Pedidos"
            />
            <div className="h-px flex-1 bg-white/10" />
            <StepIndicator active={step === "relatorio"} done={false} label="3. Relatório" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === "filtros" && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Selecione as etapas de produção a serem consideradas.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ETAPAS_DISPONIVEIS.map((etapa) => {
                  const checked = etapasSelecionadas.includes(etapa.id);
                  return (
                    <button
                      key={etapa.id}
                      onClick={() => toggleEtapa(etapa.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                        checked
                          ? "bg-blue-500/15 border-blue-500/40 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span className="text-sm">{etapa.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "selecao" && (
            <div className="space-y-3">
              {isLoadingPedidos ? (
                <div className="flex items-center justify-center py-12 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Buscando pedidos...
                </div>
              ) : pedidosComPendencias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <Package className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">
                    Nenhum pedido com materiais pendentes nas etapas selecionadas.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleTodos}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
                    >
                      <Checkbox checked={todosSelecionados} className="pointer-events-none" />
                      Marcar todos ({pedidosComPendencias.length})
                    </button>
                    <span className="text-xs text-white/60">
                      {pedidosSelecionados.size} selecionado(s)
                    </span>
                  </div>

                  <ScrollArea className="h-[50vh] pr-3">
                    <div className="space-y-2">
                      {pedidosComPendencias.map((pedido) => {
                        const checked = pedidosSelecionados.has(pedido.pedido_id);
                        return (
                          <button
                            key={pedido.pedido_id}
                            onClick={() => togglePedido(pedido.pedido_id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                              checked
                                ? "bg-blue-500/10 border-blue-500/40"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <Checkbox checked={checked} className="pointer-events-none mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-white">
                                  #{pedido.numero_pedido}
                                </span>
                                <span className="text-sm text-white/70 truncate">
                                  {pedido.cliente_nome}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-white/10 text-white/80 border-0"
                                >
                                  {ETAPA_LABEL[pedido.etapa_atual] || pedido.etapa_atual}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                                <AlertCircle className="w-3 h-3" />
                                {pedido.totalFaltantes}{" "}
                                {pedido.totalFaltantes === 1
                                  ? "material faltando"
                                  : "materiais faltando"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          )}

          {step === "relatorio" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-white/70">
                  {pedidosSelecionados.size} pedido(s) considerado(s) ·{" "}
                  <span className="text-white">{relatorio.length}</span> material(is)
                </div>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  Total faltante:{" "}
                  {totalGeralFaltante.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                </Badge>
              </div>

              <ScrollArea className="h-[55vh]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/70">Material</TableHead>
                      <TableHead className="text-white/70">Unid.</TableHead>
                      <TableHead className="text-right text-white/70">Qtd. Total</TableHead>
                      <TableHead className="text-right text-white/70">
                        Metragem Total
                      </TableHead>
                      <TableHead className="text-right text-white/70">Estoque</TableHead>
                      <TableHead className="text-right text-white/70">Faltante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-white/60 py-8">
                          Nenhum material consolidado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      relatorio.map((m) => (
                        <TableRow key={m.estoque_id} className="border-white/10">
                          <TableCell className="text-white">
                            <div className="font-medium">{m.nome_produto}</div>
                            {m.descricao_produto && (
                              <div className="text-xs text-white/50">{m.descricao_produto}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-white/70">{m.unidade || "un"}</TableCell>
                          <TableCell className="text-right text-white">
                            {m.quantidade_total.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {m.metragem_total.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-white/70">
                            {m.estoque_atual.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-bold ${
                                m.faltante > 0 ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {m.faltante.toLocaleString("pt-BR", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            {step !== "filtros" && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === "selecao") setStep("filtros");
                  else setStep("selecao");
                }}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === "filtros" && (
              <Button
                onClick={handleBuscar}
                disabled={isLoadingPedidos || etapasSelecionadas.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isLoadingPedidos ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Buscar Clientes com Materiais Pendentes
              </Button>
            )}
            {step === "selecao" && (
              <Button
                onClick={handleGerarRelatorio}
                disabled={pedidosSelecionados.size === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Gerar Relatório de Materiais
              </Button>
            )}
            {step === "relatorio" && (
              <Button
                onClick={handleExportPDF}
                disabled={relatorio.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${
        active
          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
          : done
          ? "bg-green-500/15 text-green-300 border border-green-500/30"
          : "bg-white/5 text-white/50 border border-white/10"
      }`}
    >
      {label}
    </div>
  );
}