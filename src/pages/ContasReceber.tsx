import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isAfter, isBefore, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, X, Search, DollarSign, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ContasReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [dialogPagarOpen, setDialogPagarOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null);
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(new Date());
  const [valorPago, setValorPago] = useState<number>(0);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      
      // Buscar dados das vendas separadamente
      const contasComVendas = await Promise.all(
        (data || []).map(async (conta: any) => {
          let venda = undefined;
          let empresa = undefined;
          
          if (conta.venda_id) {
            const { data: vendaData } = await supabase
              .from('vendas')
              .select('cliente_nome, cliente_telefone, valor_venda')
              .eq('id', conta.venda_id)
              .maybeSingle();
            venda = vendaData || undefined;
          }
          
          if (conta.empresa_receptora_id) {
            const { data: empresaData } = await supabase
              .from('empresas_emissoras')
              .select('nome')
              .eq('id', conta.empresa_receptora_id)
              .maybeSingle();
            empresa = empresaData || undefined;
          }
          
          return { ...conta, venda, empresa };
        })
      );
      
      return contasComVendas as ContaReceber[];
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

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "pendente" && conta.status === "pendente") ||
      (filtroStatus === "pago" && conta.status === "pago") ||
      (filtroStatus === "vencido" && conta.status === "pendente" && isBefore(parseISO(conta.data_vencimento), new Date()) && !isToday(parseISO(conta.data_vencimento))) ||
      (filtroStatus === "cancelado" && conta.status === "cancelado");
    
    const matchMetodo = filtroMetodo === "todos" || conta.metodo_pagamento === filtroMetodo;
    
    const matchBusca = !busca || 
      conta.venda?.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      conta.venda?.cliente_telefone?.includes(busca);
    
    return matchStatus && matchMetodo && matchBusca;
  });

  // Calcular resumos
  const hoje = new Date();
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAReceber)}
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVencido)}
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venceHoje)}
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venceSemana)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
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
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : contasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasFiltradas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{conta.venda?.cliente_nome || '-'}</p>
                        <p className="text-sm text-muted-foreground">{conta.venda?.cliente_telefone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{conta.numero_parcela}ª</TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor_parcela)}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{getMetodoPagamentoLabel(conta.metodo_pagamento)}</TableCell>
                    <TableCell>{getStatusBadge(conta)}</TableCell>
                    <TableCell className="text-right">
                      {conta.status === 'pendente' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAbrirDialogPagar(conta)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelarMutation.mutate(conta.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                  Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaSelecionada.valor_parcela)}
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
    </div>
  );
}