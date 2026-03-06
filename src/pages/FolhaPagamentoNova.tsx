import { useState, useMemo, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Loader2, CalendarIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MinimalistLayout } from "@/components/MinimalistLayout";

interface Colaborador {
  id: string;
  nome: string;
  salario: number | null;
  modalidade_pagamento: string | null;
  em_folha: boolean | null;
}

interface ItemFolha {
  colaborador_id: string;
  colaborador_nome: string;
  salario_base: number;
  modalidade_pagamento: string | null;
  horas_adicionais: number;
  valor_hora_adicional: number;
  acrescimos: number;
  descontos: number;
  descricao_acrescimos: string;
  descricao_descontos: string;
}

export default function FolhaPagamentoNova() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const currentDate = new Date();
  const [mesReferencia, setMesReferencia] = useState<Date>(startOfMonth(currentDate));
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>(addMonths(startOfMonth(currentDate), 1));
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<Record<string, ItemFolha>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rascunhoId, setRascunhoId] = useState<string | null>(null);

  const mesesDisponiveis = useMemo(() => {
    const meses = [];
    for (let i = -6; i <= 2; i++) {
      meses.push(addMonths(startOfMonth(currentDate), i));
    }
    return meses;
  }, []);

  // List all drafts
  const { data: rascunhosSalvos = [] } = useQuery({
    queryKey: ["folhas-rascunhos-salvos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("id, mes_referencia, total_liquido, created_at")
        .eq("status", "rascunho")
        .order("mes_referencia", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Only block months that are "finalizada"
  const { data: mesesPreenchidos = new Set<string>() } = useQuery({
    queryKey: ["folhas-meses-preenchidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("mes_referencia, status")
        .eq("status", "finalizada");
      if (error) throw error;
      return new Set((data || []).map((f: { mes_referencia: string }) => f.mes_referencia.substring(0, 7)));
    },
  });

  // Load draft for selected month
  const mesKey = format(mesReferencia, "yyyy-MM");
  const { data: rascunhoData } = useQuery({
    queryKey: ["folha-rascunho", mesKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("*")
        .eq("status", "rascunho")
        .gte("mes_referencia", mesKey + "-01")
        .lt("mes_referencia", mesKey + "-32")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: itensData, error: itensError } = await supabase
        .from("folha_pagamento_itens")
        .select("*")
        .eq("folha_id", data.id);
      if (itensError) throw itensError;

      return { folha: data, itens: itensData || [] };
    },
  });

  // Auto-select first available month
  useMemo(() => {
    if (mesesPreenchidos.size > 0) {
      const currentKey = format(mesReferencia, "yyyy-MM");
      if (mesesPreenchidos.has(currentKey)) {
        const available = mesesDisponiveis.find(m => !mesesPreenchidos.has(format(m, "yyyy-MM")));
        if (available) setMesReferencia(available);
      }
    }
  }, [mesesPreenchidos]);

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores-folha"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, nome, salario, modalidade_pagamento, em_folha")
        .eq("ativo", true)
        .eq("eh_colaborador", true)
        .eq("em_folha", true)
        .order("nome");

      if (error) throw error;
      return data as Colaborador[];
    },
  });

  // Initialize items from collaborators, then overlay draft data
  useEffect(() => {
    if (!colaboradores.length) return;

    const initialItens: Record<string, ItemFolha> = {};
    colaboradores.forEach((col) => {
      initialItens[col.id] = {
        colaborador_id: col.id,
        colaborador_nome: col.nome,
        salario_base: col.salario || 0,
        modalidade_pagamento: col.modalidade_pagamento,
        horas_adicionais: 0,
        valor_hora_adicional: 0,
        acrescimos: 0,
        descontos: 0,
        descricao_acrescimos: "",
        descricao_descontos: "",
      };
    });

    if (rascunhoData) {
      setRascunhoId(rascunhoData.folha.id);
      setObservacoes(rascunhoData.folha.observacoes || "");
      if (rascunhoData.folha.data_vencimento) {
        setDataVencimento(new Date(rascunhoData.folha.data_vencimento + "T12:00:00"));
      }
      rascunhoData.itens.forEach((item: any) => {
        if (initialItens[item.colaborador_id]) {
          initialItens[item.colaborador_id] = {
            ...initialItens[item.colaborador_id],
            salario_base: item.salario_base ?? initialItens[item.colaborador_id].salario_base,
            horas_adicionais: item.horas_adicionais ?? 0,
            valor_hora_adicional: item.valor_hora_adicional ?? 0,
            acrescimos: item.acrescimos ?? 0,
            descontos: item.descontos ?? 0,
            descricao_acrescimos: item.descricao_acrescimos ?? "",
            descricao_descontos: item.descricao_descontos ?? "",
          };
        }
      });
    } else {
      setRascunhoId(null);
    }

    setItens(initialItens);
  }, [colaboradores, rascunhoData]);

  const updateItem = (colaboradorId: string, field: keyof ItemFolha, value: number | string) => {
    setItens(prev => ({
      ...prev,
      [colaboradorId]: {
        ...prev[colaboradorId],
        [field]: value,
      },
    }));
  };

  const calcularTotalBruto = (item: ItemFolha) => {
    const totalHoras = item.horas_adicionais * item.valor_hora_adicional;
    return item.salario_base + totalHoras + item.acrescimos;
  };

  const calcularTotalLiquido = (item: ItemFolha) => {
    return calcularTotalBruto(item) - item.descontos;
  };

  const totais = useMemo(() => {
    let totalBruto = 0;
    let totalDescontos = 0;
    let totalLiquido = 0;

    Object.values(itens).forEach(item => {
      totalBruto += calcularTotalBruto(item);
      totalDescontos += item.descontos;
      totalLiquido += calcularTotalLiquido(item);
    });

    return { totalBruto, totalDescontos, totalLiquido };
  }, [itens]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Save draft mutation
  const salvarRascunhoMutation = useMutation({
    mutationFn: async () => {
      if (!dataVencimento) throw new Error("Selecione a data de vencimento");
      if (Object.keys(itens).length === 0) throw new Error("Nenhum colaborador para salvar");

      let folhaId = rascunhoId;

      if (folhaId) {
        // Update existing draft
        const { error } = await supabase
          .from("folhas_pagamento")
          .update({
            data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
            total_bruto: totais.totalBruto,
            total_descontos: totais.totalDescontos,
            total_liquido: totais.totalLiquido,
            observacoes,
          })
          .eq("id", folhaId);
        if (error) throw error;

        // Delete old items
        const { error: delError } = await supabase
          .from("folha_pagamento_itens")
          .delete()
          .eq("folha_id", folhaId);
        if (delError) throw delError;
      } else {
        // Insert new draft
        const { data: folha, error } = await supabase
          .from("folhas_pagamento")
          .insert({
            mes_referencia: format(mesReferencia, "yyyy-MM-dd"),
            data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
            total_bruto: totais.totalBruto,
            total_descontos: totais.totalDescontos,
            total_liquido: totais.totalLiquido,
            status: "rascunho",
            observacoes,
            created_by: user?.id,
          })
          .select()
          .single();
        if (error) throw error;
        folhaId = folha.id;
        setRascunhoId(folha.id);
      }

      // Insert items
      const itemsToInsert = Object.values(itens).map(item => {
        const totalHorasAdicionais = item.horas_adicionais * item.valor_hora_adicional;
        return {
          folha_id: folhaId!,
          colaborador_id: item.colaborador_id,
          colaborador_nome: item.colaborador_nome,
          salario_base: item.salario_base,
          modalidade_pagamento: item.modalidade_pagamento,
          horas_adicionais: item.horas_adicionais,
          valor_hora_adicional: item.valor_hora_adicional,
          total_horas_adicionais: totalHorasAdicionais,
          acrescimos: item.acrescimos,
          descontos: item.descontos,
          descricao_acrescimos: item.descricao_acrescimos,
          descricao_descontos: item.descricao_descontos,
          total_bruto: calcularTotalBruto(item),
          total_liquido: calcularTotalLiquido(item),
        };
      });

      const { error: insertError } = await supabase
        .from("folha_pagamento_itens")
        .insert(itemsToInsert);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Rascunho salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["folha-rascunho"] });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar rascunho");
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      if (!dataVencimento) {
        throw new Error("Selecione a data de vencimento");
      }

      if (Object.keys(itens).length === 0) {
        throw new Error("Nenhum colaborador para gerar folha");
      }

      let folhaId: string;

      if (rascunhoId) {
        // Update existing draft to finalized
        const { error } = await supabase
          .from("folhas_pagamento")
          .update({
            data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
            total_bruto: totais.totalBruto,
            total_descontos: totais.totalDescontos,
            total_liquido: totais.totalLiquido,
            status: "finalizada",
            observacoes,
          })
          .eq("id", rascunhoId);
        if (error) throw error;
        folhaId = rascunhoId;

        // Delete old items (will re-insert with conta_pagar_id)
        const { error: delError } = await supabase
          .from("folha_pagamento_itens")
          .delete()
          .eq("folha_id", folhaId);
        if (delError) throw delError;
      } else {
        const { data: folha, error: folhaError } = await supabase
          .from("folhas_pagamento")
          .insert({
            mes_referencia: format(mesReferencia, "yyyy-MM-dd"),
            data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
            total_bruto: totais.totalBruto,
            total_descontos: totais.totalDescontos,
            total_liquido: totais.totalLiquido,
            status: "finalizada",
            observacoes,
            created_by: user?.id,
          })
          .select()
          .single();

        if (folhaError) throw folhaError;
        folhaId = folha.id;
      }

      const mesRef = format(mesReferencia, "MMMM/yyyy", { locale: ptBR });
      const grupoId = crypto.randomUUID();

      for (const item of Object.values(itens)) {
        const totalBruto = calcularTotalBruto(item);
        const totalLiquido = calcularTotalLiquido(item);
        const totalHorasAdicionais = item.horas_adicionais * item.valor_hora_adicional;

        const { data: contaPagar, error: contaError } = await supabase
          .from("contas_pagar")
          .insert({
            descricao: `Folha de Pagamento - ${mesRef} - ${item.colaborador_nome}`,
            categoria: "salarios",
            valor_parcela: totalLiquido,
            data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
            status: "pendente",
            numero_parcela: 1,
            total_parcelas: 1,
            grupo_id: grupoId,
            created_by: user?.id,
          })
          .select()
          .single();

        if (contaError) throw contaError;

        const { error: itemError } = await supabase
          .from("folha_pagamento_itens")
          .insert({
            folha_id: folhaId,
            colaborador_id: item.colaborador_id,
            colaborador_nome: item.colaborador_nome,
            salario_base: item.salario_base,
            modalidade_pagamento: item.modalidade_pagamento,
            horas_adicionais: item.horas_adicionais,
            valor_hora_adicional: item.valor_hora_adicional,
            total_horas_adicionais: totalHorasAdicionais,
            acrescimos: item.acrescimos,
            descontos: item.descontos,
            descricao_acrescimos: item.descricao_acrescimos,
            descricao_descontos: item.descricao_descontos,
            total_bruto: totalBruto,
            total_liquido: totalLiquido,
            conta_pagar_id: contaPagar.id,
          });

        if (itemError) throw itemError;
      }

      return folhaId;
    },
    onSuccess: () => {
      toast.success("Folha de pagamento finalizada! Contas a pagar geradas com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["contas-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["folhas-meses-preenchidos"] });
      queryClient.invalidateQueries({ queryKey: ["folha-rascunho"] });
      navigate("/administrativo/rh-dp/colaboradores");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao finalizar folha de pagamento");
    },
  });

  const handleFinalizar = () => {
    finalizarMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <MinimalistLayout
      title="Folha de Pagamento"
      subtitle="Gere a folha mensal dos colaboradores"
      backPath="/administrativo/rh-dp/colaboradores"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Administrativo', path: '/administrativo' },
        { label: 'RH/DP', path: '/administrativo/rh-dp/colaboradores' },
        { label: 'Folha de Pagamento' },
      ]}
    >
      <div className="space-y-6">
        {/* Draft indicator */}
        {rascunhoId && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Save className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-300">
              Rascunho carregado para {format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })}. Continue editando e salve ou finalize.
            </span>
          </div>
        )}

        {/* Configuração da Folha */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Configuração</h2>
            <p className="text-xs text-white/40 mt-0.5">Defina o mês de referência e a data de vencimento</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Mês de Referência</label>
              <Select
                value={format(mesReferencia, "yyyy-MM")}
                onValueChange={(value) => setMesReferencia(new Date(value + "-01"))}
              >
                <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map((mes) => {
                    const key = format(mes, "yyyy-MM");
                    const jaPreenchido = mesesPreenchidos.has(key);
                    return (
                      <SelectItem key={key} value={key} className="text-sm" disabled={jaPreenchido}>
                        {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}{jaPreenchido ? " (já finalizada)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Data de Vencimento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-sm bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white",
                      !dataVencimento && "text-white/40"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-white/40" />
                    {dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVencimento}
                    onSelect={setDataVencimento}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Observações</label>
              <Textarea
                placeholder="Observações gerais da folha..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="h-9 min-h-9 text-sm resize-none bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        {/* Colaboradores */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Colaboradores em Folha</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {colaboradores.length} colaboradores • Informe horas extras, acréscimos e descontos
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Total a Pagar</p>
              <p className="text-lg font-bold text-blue-400">{formatCurrency(totais.totalLiquido)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-left py-2 px-3 min-w-[150px]">Colaborador</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-left py-2 px-3">Modalidade</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-right py-2 px-3">Salário Base</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-center py-2 px-3">Horas Add</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-right py-2 px-3">Valor/h</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-right py-2 px-3">Acréscimos</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-right py-2 px-3">Descontos</th>
                  <th className="text-[10px] uppercase tracking-wider text-white/40 font-medium text-right py-2 px-3">Total Líquido</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-white/30 text-sm">
                      Nenhum colaborador em folha encontrado
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((colaborador) => {
                    const item = itens[colaborador.id];
                    if (!item) return null;
                    
                    return (
                      <tr key={colaborador.id} className="h-[30px] border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-1 px-3 text-xs font-medium text-white">
                          {colaborador.nome}
                        </td>
                        <td className="py-1 px-3">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70">
                            {item.modalidade_pagamento === "diaria" ? "Diária" : "Mensal"}
                          </span>
                        </td>
                        <td className="py-1 px-3 text-xs text-right font-medium text-white/80">
                          {formatCurrency(item.salario_base)}
                        </td>
                        <td className="py-1 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.horas_adicionais || ""}
                            onChange={(e) => updateItem(colaborador.id, "horas_adicionais", parseFloat(e.target.value) || 0)}
                            className="h-7 w-16 text-xs text-center bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valor_hora_adicional || ""}
                            onChange={(e) => updateItem(colaborador.id, "valor_hora_adicional", parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 text-xs text-right bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            placeholder="0,00"
                          />
                        </td>
                        <td className="py-1 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.acrescimos || ""}
                            onChange={(e) => updateItem(colaborador.id, "acrescimos", parseFloat(e.target.value) || 0)}
                            className="h-7 w-24 text-xs text-right bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            placeholder="0,00"
                          />
                        </td>
                        <td className="py-1 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.descontos || ""}
                            onChange={(e) => updateItem(colaborador.id, "descontos", parseFloat(e.target.value) || 0)}
                            className="h-7 w-24 text-xs text-right bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            placeholder="0,00"
                          />
                        </td>
                        <td className="py-1 px-3 text-right">
                          <span className="text-xs font-bold text-blue-400">
                            {formatCurrency(calcularTotalLiquido(item))}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="mt-4 flex justify-end">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-2 min-w-[280px]">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Total Bruto:</span>
                <span className="font-medium text-white">{formatCurrency(totais.totalBruto)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Total Descontos:</span>
                <span className="font-medium text-red-400">- {formatCurrency(totais.totalDescontos)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-white">Total Líquido:</span>
                <span className="font-bold text-blue-400">{formatCurrency(totais.totalLiquido)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/administrativo/rh-dp/colaboradores")}
            className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white/70 
                       hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => salvarRascunhoMutation.mutate()}
            disabled={salvarRascunhoMutation.isPending || colaboradores.length === 0}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium
                       hover:bg-amber-500/30 hover:text-amber-200 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {salvarRascunhoMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Rascunho
          </button>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={finalizarMutation.isPending || colaboradores.length === 0}
            className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-medium
                       shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {finalizarMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Finalizar e Gerar Contas a Pagar
          </button>

          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja finalizar a folha de pagamento de{" "}
                  <strong className="text-foreground">
                    {format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })}
                  </strong>{" "}
                  e gerar as contas a pagar? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizar}>
                  Sim, Finalizar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MinimalistLayout>
  );
}
