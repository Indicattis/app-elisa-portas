import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Package, Loader2, Wrench, FileText, Paperclip, ExternalLink, CheckCircle, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  OPCOES_INTERNA_EXTERNA,
  OPCOES_LADO_MOTOR,
  OPCOES_POSICAO_GUIA,
  OPCOES_GUIA,
  OPCOES_APARENCIA_TESTEIRA,
} from "@/types/pedidoObservacoes";

interface OrdemTerceirizacaoLike {
  id: string;
  pedido_id: string;
  numero_ordem: string;
  status: string;
  capturada_em?: string;
  pedido?: {
    cliente_nome?: string;
    numero_pedido?: string;
    observacoes?: string;
    updated_at?: string;
    endereco_rua?: string | null;
    endereco_numero?: string | null;
    endereco_bairro?: string | null;
    endereco_cidade?: string | null;
    endereco_estado?: string | null;
    endereco_cep?: string | null;
    venda_id?: string;
    vendas?: {
      data_prevista_entrega?: string;
      observacoes_venda?: string;
      bairro?: string | null;
      cidade?: string | null;
      estado?: string | null;
      cep?: string | null;
    };
    produtos?: Array<{
      tipo_produto?: string;
      cor_nome?: string;
      cor_codigo_hex?: string;
      tamanho?: string;
      quantidade?: number;
      descricao?: string;
    }>;
  };
}

interface TerceirizacaoDownbarProps {
  ordem: OrdemTerceirizacaoLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir: (ordemId: string) => void;
  isConcluindo: boolean;
}

export function TerceirizacaoDownbar({
  ordem,
  open,
  onOpenChange,
  onConcluir,
  isConcluindo,
}: TerceirizacaoDownbarProps) {
  const [itensMarcados, setItensMarcados] = useState<Set<string>>(new Set());

  // Buscar venda_id a partir do pedido (caso não venha aninhado)
  const { data: pedidoVenda } = useQuery({
    queryKey: ["terceirizacao-pedido-venda", ordem?.pedido_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select("venda_id, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep")
        .eq("id", ordem!.pedido_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!ordem?.pedido_id,
  });

  const vendaId = pedidoVenda?.venda_id;

  // Itens de Porta Social da venda (a "ordem de terceirização" é por porta social)
  const { data: itensPortaSocial, isLoading: isLoadingItens } = useQuery({
    queryKey: ["terceirizacao-itens", vendaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_vendas")
        .select("id, descricao, quantidade, tamanho, largura, altura, tipo_produto")
        .eq("venda_id", vendaId!)
        .eq("tipo_produto", "porta_social");
      if (error) throw error;
      return data;
    },
    enabled: open && !!vendaId,
  });

  // Contratos
  const { data: contratos } = useQuery({
    queryKey: ["terceirizacao-contratos", vendaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos_vendas")
        .select("id, arquivo_url, nome_arquivo")
        .eq("venda_id", vendaId!);
      if (error) throw error;
      return data;
    },
    enabled: open && !!vendaId,
  });

  // Observações da visita técnica
  const { data: observacoesVisita } = useQuery({
    queryKey: ["terceirizacao-obs-visita", ordem?.pedido_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedido_porta_observacoes")
        .select(`
          *,
          produto:produtos_vendas!produto_venda_id(largura, altura, tamanho, tipo_produto)
        `)
        .eq("pedido_id", ordem!.pedido_id)
        .order("indice_porta", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open && !!ordem?.pedido_id,
  });

  // Reset checkboxes ao abrir/trocar ordem
  useEffect(() => {
    if (open) setItensMarcados(new Set());
  }, [open, ordem?.id]);

  const toggleItem = (id: string) => {
    setItensMarcados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTodos = () => {
    if (!itensPortaSocial) return;
    setItensMarcados(new Set(itensPortaSocial.map((i) => i.id)));
  };

  const totalItens = itensPortaSocial?.length ?? 0;
  const todosMarcados = totalItens > 0 && itensMarcados.size === totalItens;

  const handleConcluir = () => {
    if (!ordem) return;
    if (!todosMarcados) {
      toast.error("Marque todos os itens antes de concluir");
      return;
    }
    onConcluir(ordem.id);
  };

  if (!ordem) return null;

  const venda = ordem.pedido?.vendas;
  const pedidoEnd = pedidoVenda;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setItensMarcados(new Set());
        onOpenChange(o);
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl max-w-[700px] mx-auto bg-zinc-900 border-t border-white/10 p-0"
      >
        {/* Header gradiente */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm px-6 py-4 rounded-t-2xl border-b border-white/10">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/10">
                  <Package className="h-4 w-4 text-blue-300" />
                </div>
                Terceirização — Porta Social
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  {contratos && contratos.length > 0 ? (
                    contratos.length === 1 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => window.open(contratos[0].arquivo_url, "_blank")}
                            className="flex items-center gap-1.5 text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            Contrato
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{contratos[0].nome_arquivo}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg">
                            <Paperclip className="h-3.5 w-3.5" />
                            Contratos ({contratos.length})
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {contratos.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              onClick={() => window.open(c.arquivo_url, "_blank")}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {c.nome_arquivo}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  ) : null}
                </TooltipProvider>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(85vh-80px)] px-6 py-4">
          <div className="space-y-4 pb-4">
            {/* Hero card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-base">{ordem.pedido?.cliente_nome}</p>
                  <p className="text-white/50 text-xs">
                    Pedido {ordem.pedido?.numero_pedido || "N/A"} · Ordem {ordem.numero_ordem}
                  </p>
                </div>
                {venda?.data_prevista_entrega && (
                  <div className="text-right">
                    <p className="text-white/50 text-xs">Entrega prevista</p>
                    <p className="text-white/80 text-sm font-medium">
                      {format(new Date(venda.data_prevista_entrega + "T12:00:00"), "dd/MM/yy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <CoresPortasEnrolar produtos={ordem.pedido?.produtos} />
              </div>
              {(() => {
                const rua = pedidoEnd?.endereco_rua;
                const numero = pedidoEnd?.endereco_numero;
                const bairro = pedidoEnd?.endereco_bairro || venda?.bairro;
                const cidade = pedidoEnd?.endereco_cidade || venda?.cidade;
                const estado = pedidoEnd?.endereco_estado || venda?.estado;
                const cep = pedidoEnd?.endereco_cep || venda?.cep;
                const partes: string[] = [];
                if (rua) partes.push(numero ? `${rua}, Nº ${numero}` : rua);
                if (bairro) partes.push(bairro);
                if (cidade && estado) partes.push(`${cidade}/${estado}`);
                else if (cidade) partes.push(cidade);
                if (cep) partes.push(`CEP ${cep}`);
                return partes.length > 0 ? (
                  <p className="text-white/40 text-xs">{partes.join(" - ")}</p>
                ) : null;
              })()}
            </div>

            {/* Observações do Pedido */}
            {ordem.pedido?.observacoes && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Observações do Pedido
                  </span>
                  {ordem.pedido?.updated_at && (
                    <span className="text-xs text-amber-400/50">
                      {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-200/80 whitespace-pre-line">
                  {ordem.pedido.observacoes}
                </p>
              </div>
            )}

            {/* Observações da Venda */}
            {venda?.observacoes_venda && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5 mb-1">
                  <FileText className="h-3 w-3" />
                  Observações da Venda
                </span>
                <p className="text-xs text-amber-200/80 whitespace-pre-line">
                  {venda.observacoes_venda}
                </p>
              </div>
            )}

            {/* Especificações da Visita Técnica */}
            {observacoesVisita && observacoesVisita.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">
                    Especificações da Visita Técnica
                  </span>
                  <span className="text-xs text-amber-400/60">
                    ({observacoesVisita.length} {observacoesVisita.length === 1 ? "porta" : "portas"})
                  </span>
                </div>
                <div className="space-y-2">
                  {observacoesVisita.map((obs: any, idx: number) => (
                    <div
                      key={obs.id || idx}
                      className="p-2 rounded-md bg-amber-500/5 border border-amber-500/10"
                    >
                      <span className="text-[11px] font-medium text-amber-400 mb-1.5 block">
                        Porta {idx + 1}
                        {obs.produto && (
                          <span className="text-amber-300/70 ml-2">
                            -{" "}
                            {obs.produto.largura && obs.produto.altura
                              ? `${Number(obs.produto.largura).toFixed(2)}m × ${Number(
                                  obs.produto.altura
                                ).toFixed(2)}m`
                              : obs.produto.tamanho || ""}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {obs.interna_externa && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 bg-amber-500/10 border-amber-500/30 text-amber-300"
                          >
                            {OPCOES_INTERNA_EXTERNA[obs.interna_externa as keyof typeof OPCOES_INTERNA_EXTERNA] || obs.interna_externa}
                          </Badge>
                        )}
                        {obs.lado_motor && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 bg-blue-500/10 border-blue-500/30 text-blue-300"
                          >
                            Motor: {OPCOES_LADO_MOTOR[obs.lado_motor as keyof typeof OPCOES_LADO_MOTOR] || obs.lado_motor}
                          </Badge>
                        )}
                        {obs.posicao_guia && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 bg-purple-500/10 border-purple-500/30 text-purple-300"
                          >
                            {OPCOES_POSICAO_GUIA[obs.posicao_guia as keyof typeof OPCOES_POSICAO_GUIA] || obs.posicao_guia}
                          </Badge>
                        )}
                        {obs.opcao_guia && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 bg-green-500/10 border-green-500/30 text-green-300"
                          >
                            {OPCOES_GUIA[obs.opcao_guia as keyof typeof OPCOES_GUIA] || obs.opcao_guia}
                          </Badge>
                        )}
                        {obs.aparencia_testeira && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5 bg-orange-500/10 border-orange-500/30 text-orange-300"
                          >
                            Testeira:{" "}
                            {OPCOES_APARENCIA_TESTEIRA[obs.aparencia_testeira as keyof typeof OPCOES_APARENCIA_TESTEIRA] || obs.aparencia_testeira}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itens da Terceirização (Portas Sociais) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70">
                  Itens da Terceirização
                  {totalItens > 0 && (
                    <span className="ml-2 text-xs text-white/40">
                      ({itensMarcados.size}/{totalItens})
                    </span>
                  )}
                </h3>
                {totalItens > 0 && !todosMarcados && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10"
                    onClick={marcarTodos}
                  >
                    <CheckSquare className="h-3 w-3" />
                    Marcar Todos
                  </Button>
                )}
              </div>

              {isLoadingItens ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                </div>
              ) : totalItens > 0 ? (
                <div className="space-y-1.5">
                  {itensPortaSocial!.map((item, index) => {
                    const marcado = itensMarcados.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`w-full rounded-lg border px-3 py-2 flex items-center gap-3 transition-all ${
                          marcado
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-white/5 border-white/5 hover:border-white/15"
                        }`}
                      >
                        <Checkbox
                          checked={marcado}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <span
                          className={`text-sm flex-1 text-left ${
                            marcado ? "text-emerald-300 line-through" : "text-white/80"
                          }`}
                        >
                          {index + 1}. Porta Social
                          {item.descricao ? ` — ${item.descricao}` : ""}
                        </span>
                        <div className="flex gap-3 text-xs text-white/40">
                          <span>{item.quantidade || 1}x</span>
                          {item.tamanho && <span>{item.tamanho}</span>}
                          {(item.largura || item.altura) && (
                            <span>
                              {item.largura}x{item.altura}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/30 text-center py-6">
                  Nenhum item de Porta Social encontrado nesta venda
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white bg-transparent"
                onClick={() => onOpenChange(false)}
                disabled={isConcluindo}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30"
                onClick={handleConcluir}
                disabled={!todosMarcados || isConcluindo}
              >
                {isConcluindo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir Ordem
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
