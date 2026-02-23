import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft, HandCoins, Search, ChevronDown, ChevronRight, 
  Check, X, CalendarIcon, AlertTriangle, Clock, CheckCircle,
  Ban, Folder, List
} from "lucide-react";
import { format, parseISO, isBefore, isToday, isAfter, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { cn } from "@/lib/utils";

interface ContaReceber {
  id: string;
  venda_id: string;
  created_at: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  metodo_pagamento: string | null;
  empresa_receptora_id: string | null;
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
  valor_total_venda: number;
  contas: ContaReceber[];
  total_parcelas: number;
  parcelas_pagas: number;
  total_a_receber: number;
  total_pago: number;
  tem_vencido: boolean;
}

export default function ContasReceberMinimalista() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [visualizacao, setVisualizacao] = useState<'agrupado' | 'tabela'>('agrupado');
  
  const [dialogPagarOpen, setDialogPagarOpen] = useState(false);
  const [dialogAlterarDataOpen, setDialogAlterarDataOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null);
  const [grupoParaAlterar, setGrupoParaAlterar] = useState<GrupoPedido | null>(null);
  const [valorPago, setValorPago] = useState("");
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(new Date());
  const [novaDataInicio, setNovaDataInicio] = useState<Date | undefined>();
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-receber-min'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;

      const vendaIds = [...new Set((data || []).map(c => c.venda_id))];
      const empresaIds = [...new Set((data || []).map(c => c.empresa_receptora_id).filter(Boolean))];

      let vendasMap: Record<string, any> = {};
      if (vendaIds.length > 0) {
        const { data: vendas } = await supabase
          .from('vendas')
          .select('id, cliente_nome, cliente_telefone, valor_venda')
          .in('id', vendaIds);
        (vendas || []).forEach(v => { vendasMap[v.id] = v; });
      }

      let empresasMap: Record<string, any> = {};
      if (empresaIds.length > 0) {
        const { data: empresas } = await supabase
          .from('empresas_emissoras')
          .select('id, nome')
          .in('id', empresaIds);
        (empresas || []).forEach(e => { empresasMap[e.id] = e; });
      }

      return (data || []).map(conta => ({
        ...conta,
        venda: vendasMap[conta.venda_id],
        empresa: conta.empresa_receptora_id ? empresasMap[conta.empresa_receptora_id] : undefined
      })) as ContaReceber[];
    }
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async ({ id, valorPago, dataPagamento }: { id: string; valorPago: number; dataPagamento: string }) => {
      const { error } = await supabase
        .from('contas_receber')
        .update({ status: 'pago', valor_pago: valorPago, data_pagamento: dataPagamento })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber-min'] });
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
      queryClient.invalidateQueries({ queryKey: ['contas-receber-min'] });
      toast({ title: "Conta cancelada" });
    }
  });

  const alterarDatasMutation = useMutation({
    mutationFn: async ({ contas, novaDataInicio }: { contas: ContaReceber[]; novaDataInicio: Date }) => {
      const parcelasOrdenadas = [...contas].sort((a, b) => a.numero_parcela - b.numero_parcela);
      for (let i = 0; i < parcelasOrdenadas.length; i++) {
        const novaData = addDays(novaDataInicio, i * 30);
        const { error } = await supabase
          .from('contas_receber')
          .update({ data_vencimento: format(novaData, 'yyyy-MM-dd') })
          .eq('id', parcelasOrdenadas[i].id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber-min'] });
      toast({ title: "Datas atualizadas!" });
      setDialogAlterarDataOpen(false);
      setGrupoParaAlterar(null);
    }
  });

  const hoje = new Date();

  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      const matchStatus = filtroStatus === "todos" || 
        (filtroStatus === "pendente" && conta.status === "pendente") ||
        (filtroStatus === "pago" && conta.status === "pago") ||
        (filtroStatus === "vencido" && conta.status === "pendente" && isBefore(parseISO(conta.data_vencimento), hoje) && !isToday(parseISO(conta.data_vencimento))) ||
        (filtroStatus === "cancelado" && conta.status === "cancelado");
      
      const matchMetodo = filtroMetodo === "todos" || conta.metodo_pagamento === filtroMetodo;
      const matchBusca = !busca || conta.venda?.cliente_nome?.toLowerCase().includes(busca.toLowerCase());
      
      const dataVencimento = parseISO(conta.data_vencimento);
      const matchDataInicio = !dataInicio || !isBefore(dataVencimento, dataInicio);
      const matchDataFim = !dataFim || !isAfter(dataVencimento, dataFim);
      
      return matchStatus && matchMetodo && matchBusca && matchDataInicio && matchDataFim;
    });
  }, [contas, filtroStatus, filtroMetodo, busca, dataInicio, dataFim, hoje]);

  const gruposPorPedido = useMemo((): GrupoPedido[] => {
    return Object.values(
      contasFiltradas.reduce((acc, conta) => {
        const key = conta.venda_id;
        if (!acc[key]) {
          acc[key] = {
            venda_id: key,
            cliente_nome: conta.venda?.cliente_nome || 'Cliente não identificado',
            valor_total_venda: conta.venda?.valor_venda || 0,
            contas: [],
            total_parcelas: 0,
            parcelas_pagas: 0,
            total_a_receber: 0,
            total_pago: 0,
            tem_vencido: false
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
    );
  }, [contasFiltradas, hoje]);

  const resumo = useMemo(() => {
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
    
    return contas.reduce((acc, c) => {
      if (c.status === 'pendente') {
        acc.total += c.valor_parcela;
        const dataVenc = parseISO(c.data_vencimento);
        if (isBefore(dataVenc, hoje) && !isToday(dataVenc)) acc.vencido += c.valor_parcela;
        if (isToday(dataVenc)) acc.hoje += c.valor_parcela;
        if (!isBefore(dataVenc, inicioSemana) && !isAfter(dataVenc, fimSemana)) {
          acc.semana += c.valor_parcela;
        }
      }
      return acc;
    }, { total: 0, vencido: 0, hoje: 0, semana: 0 });
  }, [contas, hoje]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getStatusBadge = (conta: ContaReceber) => {
    const dataVenc = parseISO(conta.data_vencimento);
    if (conta.status === 'pago') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Pago</Badge>;
    if (conta.status === 'cancelado') return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Cancelado</Badge>;
    if (isBefore(dataVenc, hoje) && !isToday(dataVenc)) return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">Vencido</Badge>;
    if (isToday(dataVenc)) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Vence Hoje</Badge>;
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pendente</Badge>;
  };

  const toggleGrupo = (id: string) => {
    setGruposAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMarcarPago = (conta: ContaReceber) => {
    setContaSelecionada(conta);
    setValorPago(conta.valor_parcela.toString());
    setDataPagamento(new Date());
    setDialogPagarOpen(true);
  };

  const handleAlterarDatas = (grupo: GrupoPedido) => {
    setGrupoParaAlterar(grupo);
    setNovaDataInicio(undefined);
    setDialogAlterarDataOpen(true);
  };

  const cards = [
    { label: "Total a Receber", value: formatCurrency(resumo.total), icon: HandCoins, color: "from-purple-500 to-purple-700" },
    { label: "Vencido", value: formatCurrency(resumo.vencido), icon: AlertTriangle, color: "from-rose-500 to-rose-700" },
    { label: "Vence Hoje", value: formatCurrency(resumo.hoje), icon: Clock, color: "from-amber-500 to-amber-700" },
    { label: "Esta Semana", value: formatCurrency(resumo.semana), icon: CalendarIcon, color: "from-blue-500 to-blue-700" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Caixa", path: "/administrativo/financeiro/caixa" },
          { label: "Contas a Receber" }
        ]} 
        mounted={mounted} 
      />
      <FloatingProfileMenu mounted={mounted} />

      <button
        onClick={() => navigate('/administrativo/financeiro/caixa')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms' }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto px-4 py-20 space-y-6">
        {/* Header */}
        <div 
          className="flex items-center gap-3"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms' }}
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/20">
            <HandCoins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contas a Receber</h1>
            <p className="text-white/60 text-sm">Gestão de parcelas e recebimentos</p>
          </div>
        </div>

        {/* Cards resumo */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms' }}
        >
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${c.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{c.label}</p>
                      <p className="text-sm font-semibold text-white">{c.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <Card 
          className="bg-white/5 border-white/10"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 400ms' }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
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
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, 'dd/MM') : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} /></PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, 'dd/MM') : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dataFim} onSelect={setDataFim} /></PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toggle de visualização */}
        <div 
          className="flex gap-1"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 450ms' }}
        >
          <Button
            size="sm"
            variant={visualizacao === 'agrupado' ? 'default' : 'outline'}
            className={cn(
              visualizacao === 'agrupado' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            )}
            onClick={() => setVisualizacao('agrupado')}
          >
            <Folder className="h-4 w-4 mr-1.5" /> Agrupado
          </Button>
          <Button
            size="sm"
            variant={visualizacao === 'tabela' ? 'default' : 'outline'}
            className={cn(
              visualizacao === 'tabela' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            )}
            onClick={() => setVisualizacao('tabela')}
          >
            <List className="h-4 w-4 mr-1.5" /> Tabela
          </Button>
        </div>

        {/* Conteúdo */}
        <Card 
          className="bg-white/5 border-white/10"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 500ms' }}
        >
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : visualizacao === 'tabela' ? (
              /* Visualização em tabela plana */
              contasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-white/50">Nenhuma conta encontrada</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/60">Data Criação</TableHead>
                      <TableHead className="text-white/60">Cliente</TableHead>
                      <TableHead className="text-white/60">Método</TableHead>
                      <TableHead className="text-white/60">Valor</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                      <TableHead className="text-white/60 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...contasFiltradas]
                      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                      .map((conta) => (
                        <TableRow key={conta.id} className="border-white/10">
                          <TableCell className="text-white">{format(parseISO(conta.created_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-white font-medium">{conta.venda?.cliente_nome || '—'}</TableCell>
                          <TableCell className="text-white/70">{conta.metodo_pagamento || '—'}</TableCell>
                          <TableCell className="text-white font-medium">{formatCurrency(conta.valor_parcela)}</TableCell>
                          <TableCell>{getStatusBadge(conta)}</TableCell>
                          <TableCell className="text-right">
                            {conta.status === 'pendente' && (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/20" onClick={() => handleMarcarPago(conta)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/20" onClick={() => cancelarMutation.mutate(conta.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )
            ) : (
              /* Visualização agrupada (existente) */
              gruposPorPedido.length === 0 ? (
                <div className="text-center py-12 text-white/50">Nenhuma conta encontrada</div>
              ) : (
                <div className="space-y-2">
                  {gruposPorPedido.map((grupo) => (
                    <Collapsible key={grupo.venda_id} open={gruposAbertos[grupo.venda_id]} onOpenChange={() => toggleGrupo(grupo.venda_id)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            {gruposAbertos[grupo.venda_id] ? <ChevronDown className="h-4 w-4 text-white/60" /> : <ChevronRight className="h-4 w-4 text-white/60" />}
                            <Folder className="h-4 w-4 text-purple-400" />
                            <div>
                              <p className="font-medium text-white">{grupo.cliente_nome}</p>
                              <p className="text-xs text-white/50">{grupo.parcelas_pagas}/{grupo.total_parcelas} parcelas pagas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {grupo.tem_vencido && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-400">{formatCurrency(grupo.total_a_receber)}</p>
                              <p className="text-xs text-white/50">a receber</p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 ml-6 space-y-2">
                          <div className="flex justify-end mb-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                              onClick={() => handleAlterarDatas(grupo)}
                            >
                              <CalendarIcon className="h-3 w-3 mr-1" /> Alterar Datas
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/10">
                                <TableHead className="text-white/60">Parcela</TableHead>
                                <TableHead className="text-white/60">Vencimento</TableHead>
                                <TableHead className="text-white/60">Valor</TableHead>
                                <TableHead className="text-white/60">Método</TableHead>
                                <TableHead className="text-white/60">Status</TableHead>
                                <TableHead className="text-white/60 text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grupo.contas.sort((a, b) => a.numero_parcela - b.numero_parcela).map((conta) => (
                                <TableRow key={conta.id} className="border-white/10">
                                  <TableCell className="text-white">{conta.numero_parcela}ª</TableCell>
                                  <TableCell className="text-white">{format(parseISO(conta.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="text-white font-medium">{formatCurrency(conta.valor_parcela)}</TableCell>
                                  <TableCell className="text-white/70">{conta.metodo_pagamento || '-'}</TableCell>
                                  <TableCell>{getStatusBadge(conta)}</TableCell>
                                  <TableCell className="text-right">
                                    {conta.status === 'pendente' && (
                                      <div className="flex justify-end gap-1">
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/20" onClick={() => handleMarcarPago(conta)}>
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/20" onClick={() => cancelarMutation.mutate(conta.id)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Marcar Pago */}
      <Dialog open={dialogPagarOpen} onOpenChange={setDialogPagarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar como Pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor Pago</Label>
              <Input type="number" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
            </div>
            <div>
              <Label>Data do Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPagamento ? format(dataPagamento, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dataPagamento} onSelect={setDataPagamento} /></PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagarOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (contaSelecionada && dataPagamento) {
                marcarPagoMutation.mutate({
                  id: contaSelecionada.id,
                  valorPago: parseFloat(valorPago),
                  dataPagamento: format(dataPagamento, 'yyyy-MM-dd')
                });
              }
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Datas */}
      <Dialog open={dialogAlterarDataOpen} onOpenChange={setDialogAlterarDataOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Datas das Parcelas</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione a nova data para a primeira parcela. As demais serão ajustadas automaticamente (intervalo de 30 dias).</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {novaDataInicio ? format(novaDataInicio, 'dd/MM/yyyy') : 'Selecione a nova data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={novaDataInicio} onSelect={setNovaDataInicio} /></PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAlterarDataOpen(false)}>Cancelar</Button>
            <Button disabled={!novaDataInicio || !grupoParaAlterar} onClick={() => {
              if (novaDataInicio && grupoParaAlterar) {
                alterarDatasMutation.mutate({ contas: grupoParaAlterar.contas.filter(c => c.status === 'pendente'), novaDataInicio });
              }
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
