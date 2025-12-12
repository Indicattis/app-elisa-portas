import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Save, CheckCircle, Loader2, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  // Gerar lista de meses para seleção (6 meses anteriores + atual + 2 futuros)
  const mesesDisponiveis = useMemo(() => {
    const meses = [];
    for (let i = -6; i <= 2; i++) {
      meses.push(addMonths(startOfMonth(currentDate), i));
    }
    return meses;
  }, []);

  // Buscar colaboradores em folha
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
      
      // Inicializar itens com os colaboradores
      const initialItens: Record<string, ItemFolha> = {};
      (data || []).forEach((col: Colaborador) => {
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
      setItens(initialItens);
      
      return data as Colaborador[];
    },
  });

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

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      if (!dataVencimento) {
        throw new Error("Selecione a data de vencimento");
      }

      if (Object.keys(itens).length === 0) {
        throw new Error("Nenhum colaborador para gerar folha");
      }

      // 1. Criar a folha de pagamento
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

      // 2. Para cada colaborador, criar item e conta a pagar
      const mesRef = format(mesReferencia, "MMMM/yyyy", { locale: ptBR });
      const grupoId = crypto.randomUUID();

      for (const item of Object.values(itens)) {
        const totalBruto = calcularTotalBruto(item);
        const totalLiquido = calcularTotalLiquido(item);
        const totalHorasAdicionais = item.horas_adicionais * item.valor_hora_adicional;

        // Criar conta a pagar
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

        // Criar item da folha
        const { error: itemError } = await supabase
          .from("folha_pagamento_itens")
          .insert({
            folha_id: folha.id,
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

      return folha;
    },
    onSuccess: () => {
      toast.success("Folha de pagamento finalizada! Contas a pagar geradas com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["contas-pagar"] });
      navigate("/dashboard/administrativo/rh/colaboradores");
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
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/administrativo/rh/colaboradores")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Folha de Pagamento</h1>
          <p className="text-muted-foreground text-sm">
            Gere a folha de pagamento mensal dos colaboradores
          </p>
        </div>
      </div>

      {/* Configuração da Folha */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuração</CardTitle>
          <CardDescription className="text-xs">
            Defina o mês de referência e a data de vencimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Mês de Referência</Label>
              <Select
                value={format(mesReferencia, "yyyy-MM")}
                onValueChange={(value) => setMesReferencia(new Date(value + "-01"))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map((mes) => (
                    <SelectItem key={format(mes, "yyyy-MM")} value={format(mes, "yyyy-MM")} className="text-sm">
                      {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-sm",
                      !dataVencimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

            <div className="space-y-2">
              <Label className="text-xs">Observações</Label>
              <Textarea
                placeholder="Observações gerais da folha..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="h-9 min-h-9 text-sm resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colaboradores */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Colaboradores em Folha</CardTitle>
              <CardDescription className="text-xs">
                {colaboradores.length} colaboradores • Informe horas extras, acréscimos e descontos
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total a Pagar</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totais.totalLiquido)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-[10px] py-1 px-2 min-w-[150px]">Colaborador</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Modalidade</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-right">Salário Base</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-center">Horas Add</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-right">Valor/h</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-right">Acréscimos</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-right">Descontos</TableHead>
                  <TableHead className="text-[10px] py-1 px-2 text-right">Total Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum colaborador em folha encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  colaboradores.map((colaborador) => {
                    const item = itens[colaborador.id];
                    if (!item) return null;
                    
                    return (
                      <TableRow key={colaborador.id} className="h-10">
                        <TableCell className="py-1 px-2 text-[11px] font-medium">
                          {colaborador.nome}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {item.modalidade_pagamento === "diaria" ? "Diária" : "Mensal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2 text-[11px] text-right font-medium">
                          {formatCurrency(item.salario_base)}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.horas_adicionais || ""}
                            onChange={(e) => updateItem(colaborador.id, "horas_adicionais", parseFloat(e.target.value) || 0)}
                            className="h-7 w-16 text-xs text-center"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valor_hora_adicional || ""}
                            onChange={(e) => updateItem(colaborador.id, "valor_hora_adicional", parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 text-xs text-right"
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.acrescimos || ""}
                            onChange={(e) => updateItem(colaborador.id, "acrescimos", parseFloat(e.target.value) || 0)}
                            className="h-7 w-24 text-xs text-right"
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.descontos || ""}
                            onChange={(e) => updateItem(colaborador.id, "descontos", parseFloat(e.target.value) || 0)}
                            className="h-7 w-24 text-xs text-right"
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-2 text-right">
                          <span className="text-[11px] font-bold text-primary">
                            {formatCurrency(calcularTotalLiquido(item))}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="mt-4 flex justify-end">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 min-w-[280px]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bruto:</span>
                <span className="font-medium">{formatCurrency(totais.totalBruto)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Descontos:</span>
                <span className="font-medium text-destructive">- {formatCurrency(totais.totalDescontos)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-semibold">Total Líquido:</span>
                <span className="font-bold text-primary">{formatCurrency(totais.totalLiquido)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/administrativo/rh/colaboradores")}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleFinalizar}
          disabled={finalizarMutation.isPending || colaboradores.length === 0}
          className="gap-2"
        >
          {finalizarMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Finalizar e Gerar Contas a Pagar
        </Button>
      </div>
    </div>
  );
}
