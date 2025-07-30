import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface ContaReceber {
  id: string;
  venda_id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  observacoes?: string;
  vendas?: {
    cliente_nome: string;
    forma_pagamento: string;
  };
}

export default function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConta, setSelectedConta] = useState<ContaReceber | null>(null);
  const [valorPago, setValorPago] = useState("");
  const [dataPagamento, setDataPagamento] = useState<Date>();
  const [observacoes, setObservacoes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_receber")
        .select(`
          *,
          vendas!inner(cliente_nome, forma_pagamento)
        `)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      
      setContas(data as any || []);
    } catch (error) {
      console.error("Erro ao buscar contas a receber:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registrarPagamento = async () => {
    if (!selectedConta || !valorPago || !dataPagamento) return;

    try {
      const valorPagoNum = parseFloat(valorPago);
      const novoValorPago = selectedConta.valor_pago + valorPagoNum;
      const novoStatus = novoValorPago >= selectedConta.valor_parcela ? 'pago' : 'pendente';

      const { error } = await supabase
        .from("contas_receber")
        .update({
          valor_pago: novoValorPago,
          status: novoStatus,
          data_pagamento: novoStatus === 'pago' ? format(dataPagamento, 'yyyy-MM-dd') : null,
          observacoes: observacoes || selectedConta.observacoes
        })
        .eq("id", selectedConta.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso",
      });

      setSelectedConta(null);
      setValorPago("");
      setDataPagamento(undefined);
      setObservacoes("");
      fetchContas();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (conta: ContaReceber) => {
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    
    if (conta.status === 'pago') {
      return <Badge variant="default" className="bg-green-500">Pago</Badge>;
    } else if (vencimento < hoje) {
      return <Badge variant="destructive">Atrasado</Badge>;
    } else {
      return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const calcularResumo = () => {
    const total = contas.reduce((acc, conta) => acc + conta.valor_parcela, 0);
    const recebido = contas.reduce((acc, conta) => acc + conta.valor_pago, 0);
    const pendente = total - recebido;
    const atrasadas = contas.filter(conta => 
      conta.status !== 'pago' && new Date(conta.data_vencimento) < new Date()
    ).length;

    return { total, recebido, pendente, atrasadas };
  };

  const resumo = calcularResumo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contas a Receber</h1>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resumo.recebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {resumo.pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {resumo.atrasadas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell>{conta.vendas?.cliente_nome}</TableCell>
                  <TableCell>{conta.numero_parcela}</TableCell>
                  <TableCell>
                    {conta.valor_parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    {conta.valor_pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(conta)}</TableCell>
                  <TableCell>
                    {conta.status !== 'pago' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedConta(conta);
                              setObservacoes(conta.observacoes || "");
                            }}
                          >
                            Registrar Pagamento
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Pagamento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="valorPago">Valor Pago</Label>
                              <Input
                                id="valorPago"
                                type="number"
                                step="0.01"
                                value={valorPago}
                                onChange={(e) => setValorPago(e.target.value)}
                                placeholder="0,00"
                              />
                            </div>
                            
                            <div>
                              <Label>Data do Pagamento</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dataPagamento ? format(dataPagamento, 'dd/MM/yyyy', { locale: ptBR }) : "Selecionar data"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={dataPagamento}
                                    onSelect={setDataPagamento}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div>
                              <Label htmlFor="observacoes">Observações</Label>
                              <Input
                                id="observacoes"
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Observações do pagamento"
                              />
                            </div>

                            <Button onClick={registrarPagamento} className="w-full">
                              Confirmar Pagamento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}