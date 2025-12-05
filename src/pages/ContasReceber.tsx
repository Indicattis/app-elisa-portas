import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isAfter, isBefore, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, X, Search, DollarSign, Clock, AlertTriangle, TrendingUp, FolderOpen, Folder, ChevronRight, Building2, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { EtapaPedido, ETAPAS_CONFIG } from "@/types/pedidoEtapa";

interface ContaReceber {
  id: string;
  venda_id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  observacoes: string | null;
  metodo_pagamento: string | null;
  empresa_receptora_id: string | null;
  pago_na_instalacao: boolean;
  venda?: {
    cliente_nome: string;
    cliente_telefone: string;
    valor_venda: number;
  };
  empresa?: {
    nome: string;
  };
}

interface GrupoPedido {
  venda_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  valor_total_venda: number;
  contas: ContaReceber[];
  total_parcelas: number;
  parcelas_pagas: number;
  total_a_receber: number;
  total_pago: number;
  tem_vencido: boolean;
  etapa_fabrica?: EtapaPedido;
}

export default function ContasReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [dialogPagarOpen, setDialogPagarOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null);
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(new Date());
  const [valorPago, setValorPago] = useState<number>(0);
  const [pastasAbertas, setPastasAbertas] = useState<Set<string>>(new Set());
  const [dialogAlterarDataOpen, setDialogAlterarDataOpen] = useState(false);
  const [grupoParaAlterar, setGrupoParaAlterar] = useState<GrupoPedido | null>(null);
  const [novaDataInicio, setNovaDataInicio] = useState<Date | undefined>(undefined);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      
      // Buscar todos os venda_ids únicos
      const vendaIds = [...new Set((data || []).map(c => c.venda_id).filter(Boolean))];
      const empresaIds = [...new Set((data || []).map(c => c.empresa_receptora_id).filter(Boolean))];
      
      // Buscar vendas em uma única query
      let vendasMap: Record<string, any> = {};
      if (vendaIds.length > 0) {
        const { data: vendas } = await supabase
          .from('vendas')
          .select('id, cliente_nome, cliente_telefone, valor_venda')
          .in('id', vendaIds);
        
        (vendas || []).forEach(v => {
          vendasMap[v.id] = v;
        });
      }
      
      // Buscar empresas em uma única query
      let empresasMap: Record<string, any> = {};
      if (empresaIds.length > 0) {
        const { data: empresas } = await supabase
          .from('empresas_emissoras')
          .select('id, nome')
          .in('id', empresaIds);
        
        (empresas || []).forEach(e => {
          empresasMap[e.id] = e;
        });
      }
      
      // Buscar pedidos de produção para obter a etapa
      let pedidosMap: Record<string, { etapa_atual: string }> = {};
      if (vendaIds.length > 0) {
        const { data: pedidos } = await supabase
          .from('pedidos_producao')
          .select('venda_id, etapa_atual')
          .in('venda_id', vendaIds);
        
        (pedidos || []).forEach(p => {
          if (p.venda_id) pedidosMap[p.venda_id] = { etapa_atual: p.etapa_atual };
        });
      }
      
      // Combinar dados e filtrar contas órfãs (sem venda válida)
      const contasComRelacoes = (data || [])
        .map(conta => ({
          ...conta,
          venda: conta.venda_id ? vendasMap[conta.venda_id] : undefined,
          empresa: conta.empresa_receptora_id ? empresasMap[conta.empresa_receptora_id] : undefined,
          pedido: conta.venda_id ? pedidosMap[conta.venda_id] : undefined
        }))
        .filter(conta => conta.venda !== undefined); // Filtra contas sem venda válida
      
      return contasComRelacoes as (ContaReceber & { pedido?: { etapa_atual: string } })[];
    }
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async ({ id, valorPago, dataPagamento }: { id: string; valorPago: number; dataPagamento: string }) => {
      const { error } = await supabase
        .from('contas_receber')
        .update({
          status: 'pago',
          valor_pago: valorPago,
          data_pagamento: dataPagamento
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({ title: "Conta marcada como paga!" });
      setDialogPagarOpen(false);
      setContaSelecionada(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  });

  const cancelarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_receber')
        .update({ status: 'cancelado' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({ title: "Conta cancelada" });
    }
  });

  const alterarDatasMutation = useMutation({
    mutationFn: async ({ contas, novaDataInicio }: { contas: ContaReceber[]; novaDataInicio: Date }) => {
      const parcelasOrdenadas = [...contas].sort((a, b) => a.numero_parcela - b.numero_parcela);
      const intervalo = 30;
      
      for (let i = 0; i < parcelasOrdenadas.length; i++) {
        const novaData = addDays(novaDataInicio, i * intervalo);
        const { error } = await supabase
          .from('contas_receber')
          .update({ data_vencimento: format(novaData, 'yyyy-MM-dd') })
          .eq('id', parcelasOrdenadas[i].id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({ title: "Datas atualizadas com sucesso!" });
      setDialogAlterarDataOpen(false);
      setGrupoParaAlterar(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar datas", description: error.message });
    }
  });

  const handleAbrirDialogAlterar = (grupo: GrupoPedido) => {
    const primeiraParcela = grupo.contas.sort((a, b) => a.numero_parcela - b.numero_parcela)[0];
    setNovaDataInicio(parseISO(primeiraParcela.data_vencimento));
    setGrupoParaAlterar(grupo);
    setDialogAlterarDataOpen(true);
  };

  const handleAbrirDialogPagar = (conta: ContaReceber) => {
    setContaSelecionada(conta);
    setValorPago(conta.valor_parcela);
    setDataPagamento(new Date());
    setDialogPagarOpen(true);
  };

  const handleConfirmarPagamento = () => {
    if (!contaSelecionada || !dataPagamento) return;
    
    marcarPagoMutation.mutate({
      id: contaSelecionada.id,
      valorPago,
      dataPagamento: format(dataPagamento, 'yyyy-MM-dd')
    });
  };

  const togglePasta = (vendaId: string) => {
    const novas = new Set(pastasAbertas);
    if (novas.has(vendaId)) {
      novas.delete(vendaId);
    } else {
      novas.add(vendaId);
    }
    setPastasAbertas(novas);
  };

  // Filtrar contas
  const hoje = new Date();
  const contasFiltradas = contas.filter(conta => {
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "pendente" && conta.status === "pendente") ||
      (filtroStatus === "pago" && conta.status === "pago") ||
      (filtroStatus === "vencido" && conta.status === "pendente" && isBefore(parseISO(conta.data_vencimento), hoje) && !isToday(parseISO(conta.data_vencimento))) ||
      (filtroStatus === "cancelado" && conta.status === "cancelado");
    
    const matchMetodo = filtroMetodo === "todos" || conta.metodo_pagamento === filtroMetodo;
    
    const matchBusca = !busca || 
      conta.venda?.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      conta.venda?.cliente_telefone?.includes(busca);
    
    const dataVencimento = parseISO(conta.data_vencimento);
    const matchDataInicio = !dataInicio || !isBefore(dataVencimento, dataInicio);
    const matchDataFim = !dataFim || !isAfter(dataVencimento, dataFim);
    
    return matchStatus && matchMetodo && matchBusca && matchDataInicio && matchDataFim;
  });

  // Agrupar por pedido
  const gruposPorPedido: GrupoPedido[] = Object.values(
    contasFiltradas.reduce((acc, conta: any) => {
      const key = conta.venda_id;
      if (!acc[key]) {
        acc[key] = {
          venda_id: conta.venda_id,
          cliente_nome: conta.venda?.cliente_nome || 'Cliente não identificado',
          cliente_telefone: conta.venda?.cliente_telefone || '',
          valor_total_venda: conta.venda?.valor_venda || 0,
          contas: [],
          total_parcelas: 0,
          parcelas_pagas: 0,
          total_a_receber: 0,
          total_pago: 0,
          tem_vencido: false,
          etapa_fabrica: conta.pedido?.etapa_atual as EtapaPedido | undefined
        };
      }
      acc[key].contas.push(conta);
      acc[key].total_parcelas++;
      if (conta.status === 'pago') {
        acc[key].parcelas_pagas++;
        acc[key].total_pago += conta.valor_pago || conta.valor_parcela;
      } else if (conta.status === 'pendente') {
        acc[key].total_a_receber += conta.valor_parcela;
        if (isBefore(parseISO(conta.data_vencimento), hoje) && !isToday(parseISO(conta.data_vencimento))) {
          acc[key].tem_vencido = true;
        }
      }
      return acc;
    }, {} as Record<string, GrupoPedido>)
  ).sort((a, b) => {
    // Priorizar os que têm vencido
    if (a.tem_vencido && !b.tem_vencido) return -1;
    if (!a.tem_vencido && b.tem_vencido) return 1;
    return b.total_a_receber - a.total_a_receber;
  });

  // Calcular resumos
  const totalAReceber = contas
    .filter(c => c.status === 'pendente')
    .reduce((acc, c) => acc + c.valor_parcela, 0);
  
  const totalVencido = contas
    .filter(c => c.status === 'pendente' && isBefore(parseISO(c.data_vencimento), hoje) && !isToday(parseISO(c.data_vencimento)))
    .reduce((acc, c) => acc + c.valor_parcela, 0);
  
  const venceHoje = contas
    .filter(c => c.status === 'pendente' && isToday(parseISO(c.data_vencimento)))
    .reduce((acc, c) => acc + c.valor_parcela, 0);
  
  const venceSemana = contas
    .filter(c => c.status === 'pendente' && isAfter(parseISO(c.data_vencimento), hoje) && isBefore(parseISO(c.data_vencimento), addDays(hoje, 7)))
    .reduce((acc, c) => acc + c.valor_parcela, 0);

  // Calcular valores por empresa
  const valoresPorEmpresa = useMemo(() => {
    const empresasMap: Record<string, { nome: string; totalReceber: number; totalVencido: number; totalPago: number }> = {};
    
    contas.forEach(conta => {
      const empresaId = conta.empresa_receptora_id || 'sem_empresa';
      const empresaNome = conta.empresa?.nome || 'Sem empresa definida';
      
      if (!empresasMap[empresaId]) {
        empresasMap[empresaId] = {
          nome: empresaNome,
          totalReceber: 0,
          totalVencido: 0,
          totalPago: 0
        };
      }
      
      if (conta.status === 'pendente') {
        empresasMap[empresaId].totalReceber += conta.valor_parcela;
        if (isBefore(parseISO(conta.data_vencimento), hoje) && !isToday(parseISO(conta.data_vencimento))) {
          empresasMap[empresaId].totalVencido += conta.valor_parcela;
        }
      } else if (conta.status === 'pago') {
        empresasMap[empresaId].totalPago += conta.valor_pago || conta.valor_parcela;
      }
    });
    
    return Object.entries(empresasMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalReceber - a.totalReceber);
  }, [contas, hoje]);

  const getStatusBadge = (conta: ContaReceber) => {
    if (conta.status === 'pago') {
      return <Badge className="bg-green-500">Pago</Badge>;
    }
    if (conta.status === 'cancelado') {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    const dataVenc = parseISO(conta.data_vencimento);
    if (isBefore(dataVenc, hoje) && !isToday(dataVenc)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isToday(dataVenc)) {
      return <Badge className="bg-yellow-500">Vence Hoje</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getMetodoPagamentoLabel = (metodo: string | null) => {
    const labels: Record<string, string> = {
      boleto: 'Boleto',
      a_vista: 'À Vista',
      cartao_credito: 'Cartão de Crédito',
      dinheiro: 'Dinheiro'
    };
    return metodo ? labels[metodo] || metodo : '-';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contas a Receber</h1>
        <p className="text-muted-foreground mt-2">
          Gestão de parcelas e recebimentos das vendas
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAReceber)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalVencido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vence Hoje</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(venceHoje)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(venceSemana)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Valores por Empresa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Valores por Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">A Receber</TableHead>
                <TableHead className="text-right">Vencido</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valoresPorEmpresa.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{empresa.nome}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(empresa.totalReceber)}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {formatCurrency(empresa.totalVencido)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(empresa.totalPago)}
                  </TableCell>
                </TableRow>
              ))}
              {valoresPorEmpresa.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou nº pedido..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data Inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data Final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(dataInicio || dataFim) && (
              <Button variant="ghost" size="sm" onClick={() => { setDataInicio(undefined); setDataFim(undefined); }}>
                <X className="h-4 w-4 mr-1" />
                Limpar datas
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pastas por Pedido */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">Carregando...</CardContent>
          </Card>
        ) : gruposPorPedido.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma conta encontrada
            </CardContent>
          </Card>
        ) : (
          gruposPorPedido.map((grupo) => {
            const isAberta = pastasAbertas.has(grupo.venda_id);
            
            return (
              <Collapsible
                key={grupo.venda_id}
                open={isAberta}
                onOpenChange={() => togglePasta(grupo.venda_id)}
              >
                <Card className={cn(
                  "transition-all",
                  grupo.tem_vencido && "border-destructive/50 bg-destructive/5"
                )}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="py-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform",
                            isAberta && "rotate-90"
                          )} />
                          {isAberta ? (
                            <FolderOpen className="h-6 w-6 text-primary" />
                          ) : (
                            <Folder className={cn(
                              "h-6 w-6",
                              grupo.tem_vencido ? "text-destructive" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{grupo.cliente_nome}</span>
                            {grupo.etapa_fabrica && ETAPAS_CONFIG[grupo.etapa_fabrica] && (
                              <Badge className={cn(
                                "text-xs text-white",
                                ETAPAS_CONFIG[grupo.etapa_fabrica].color
                              )}>
                                <Factory className="h-3 w-3 mr-1" />
                                {ETAPAS_CONFIG[grupo.etapa_fabrica].label}
                              </Badge>
                            )}
                            {grupo.tem_vencido && (
                              <Badge variant="destructive" className="text-xs">
                                Possui parcelas vencidas
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {grupo.cliente_telefone}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-muted-foreground">Método</p>
                            <p className="font-medium">{getMetodoPagamentoLabel(grupo.contas[0]?.metodo_pagamento)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Parcelas</p>
                            <p className="font-medium">{grupo.parcelas_pagas}/{grupo.total_parcelas}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">A Receber</p>
                            <p className="font-semibold text-primary">{formatCurrency(grupo.total_a_receber)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Recebido</p>
                            <p className="font-medium text-green-600">{formatCurrency(grupo.total_pago)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAbrirDialogAlterar(grupo);
                            }}
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Alterar Datas
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium">Parcela</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Valor</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Vencimento</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Método</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                              <th className="px-4 py-2 text-right text-sm font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {grupo.contas.map((conta) => (
                              <tr key={conta.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 text-sm">
                                  {conta.numero_parcela}ª parcela
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {formatCurrency(conta.valor_parcela)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {getMetodoPagamentoLabel(conta.metodo_pagamento)}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(conta)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {conta.status === 'pendente' && (
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAbrirDialogPagar(conta);
                                        }}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Pagar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelarMutation.mutate(conta.id);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                  {conta.status === 'pago' && conta.data_pagamento && (
                                    <span className="text-sm text-muted-foreground">
                                      Pago em {format(parseISO(conta.data_pagamento), 'dd/MM/yyyy')}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Dialog de Pagamento */}
      <Dialog open={dialogPagarOpen} onOpenChange={setDialogPagarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          {contaSelecionada && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{contaSelecionada.venda?.cliente_nome}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Parcela {contaSelecionada.numero_parcela}ª</p>
                <p className="font-medium">
                  Valor: {formatCurrency(contaSelecionada.valor_parcela)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Valor Pago</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataPagamento ? format(dataPagamento, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataPagamento}
                      onSelect={setDataPagamento}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarPagamento} disabled={marcarPagoMutation.isPending}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterar Datas */}
      <Dialog open={dialogAlterarDataOpen} onOpenChange={setDialogAlterarDataOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Data de Início</DialogTitle>
          </DialogHeader>
          
          {grupoParaAlterar && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione a nova data para a primeira parcela. As {grupoParaAlterar.total_parcelas} parcelas 
                serão recalculadas com intervalo de 30 dias.
              </p>
              
              <div className="space-y-2">
                <Label>Nova Data da 1ª Parcela</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {novaDataInicio ? format(novaDataInicio, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={novaDataInicio}
                      onSelect={setNovaDataInicio}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Preview das novas datas:</p>
                {grupoParaAlterar.contas
                  .sort((a, b) => a.numero_parcela - b.numero_parcela)
                  .map((conta, index) => {
                    const novaData = novaDataInicio ? addDays(novaDataInicio, index * 30) : null;
                    return (
                      <div key={conta.id} className="flex justify-between text-sm py-1">
                        <span>{conta.numero_parcela}ª parcela</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">
                            {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy')}
                          </span>
                          <span>→</span>
                          <span className="font-medium text-primary">
                            {novaData ? format(novaData, 'dd/MM/yyyy') : '-'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAlterarDataOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (grupoParaAlterar && novaDataInicio) {
                  alterarDatasMutation.mutate({
                    contas: grupoParaAlterar.contas,
                    novaDataInicio
                  });
                }
              }}
              disabled={alterarDatasMutation.isPending || !novaDataInicio}
            >
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
