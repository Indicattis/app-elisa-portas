import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Package, 
  Undo2, 
  ArrowLeft, 
  Edit, 
  CheckCircle2,
  ExternalLink,
  Receipt,
  Minus,
  Plus,
  Calculator,
  Wrench,
  CalendarIcon,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProdutosVenda } from "@/hooks/useProdutosVenda";
import { useFaturamento } from "@/hooks/useFaturamento";
import { LucroItemModal } from "@/components/vendas/LucroItemModal";
import { ConfirmarFaturamentoDialog } from "@/components/vendas/ConfirmarFaturamentoDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePedidoCreation } from "@/hooks/usePedidoCreation";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";

interface Venda {
  id: string;
  cliente_nome: string;
  valor_venda: number;
  valor_frete: number;
  valor_instalacao: number;
  valor_credito?: number;
  lucro_total: number;
  frete_aprovado: boolean;
  comprovante_url?: string;
  comprovante_nome?: string;
  lucro_instalacao?: number;
  custo_instalacao?: number;
  instalacao_faturada?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function FaturamentoVendaMinimalista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<any | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPedidoDialog, setShowPedidoDialog] = useState(false);
  const [showPedidoDuplicadoDialog, setShowPedidoDuplicadoDialog] = useState(false);
  const [showRemoverFaturamentoDialog, setShowRemoverFaturamentoDialog] = useState(false);
  const [pedidoExistenteId, setPedidoExistenteId] = useState<string | null>(null);
  const [checkingPedido, setCheckingPedido] = useState(false);
  const [hasPedido, setHasPedido] = useState<boolean | null>(null);
  const [contasReceber, setContasReceber] = useState<any[]>([]);
  const { createPedidoFromVenda, checkExistingPedido } = usePedidoCreation();
  const { removerFaturamento, isRemovendo } = useFaturamento();

  const {
    produtos,
    isLoading: isLoadingProdutos,
    updateLucroItem,
    isUpdatingLucro,
    finalizarFaturamento,
    isFinalizandoFaturamento,
  } = useProdutosVenda(id);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id) {
      fetchVenda();
      checkPedidoExistente();
      fetchContasReceber();
    }
  }, [id]);

  const checkPedidoExistente = async () => {
    if (!id) return;
    const pedidoId = await checkExistingPedido(id);
    setHasPedido(!!pedidoId);
    if (pedidoId) {
      setPedidoExistenteId(pedidoId);
    }
  };

  const fetchContasReceber = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('contas_receber')
      .select('id, venda_id, metodo_pagamento, data_vencimento, status, observacoes, data_pagamento, valor_parcela, numero_parcela')
      .eq('venda_id', id)
      .order('numero_parcela');
    if (!error && data) setContasReceber(data);
  };

  const handleUpdatePagamento = async (pagamentoId: string, field: string, value: string) => {
    const updates: any = { [field]: value };
    if (field === 'status' && value === 'pago') {
      updates.data_pagamento = new Date().toISOString().split('T')[0];
    }
    const { error } = await supabase
      .from('contas_receber')
      .update(updates)
      .eq('id', pagamentoId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar parcela' });
      return;
    }
    setContasReceber(prev => prev.map(p => p.id === pagamentoId ? { ...p, ...updates } : p));
    if (field === 'status') {
      toast({ title: 'Parcela atualizada com sucesso' });
    }
  };

  // Auto-faturar produtos pintura_epoxi com 30% de lucro
  useEffect(() => {
    if (!produtos || produtos.length === 0 || isUpdatingLucro) return;
    
    const produtosPinturaParaAutoFaturar = produtos.filter(p => 
      p.tipo_produto === 'pintura_epoxi' && 
      (p.lucro_item === null || p.lucro_item === undefined) &&
      !p.faturamento
    );
    
    if (produtosPinturaParaAutoFaturar.length === 0) return;
    
    // Auto-preencher lucro de 30% para cada produto de pintura
    produtosPinturaParaAutoFaturar.forEach(async (produto) => {
      const lucro30percent = produto.valor_total * 0.30;
      const custoCalculado = produto.valor_total - lucro30percent;
      await updateLucroItem({ 
        produtoId: produto.id, 
        lucroItem: lucro30percent,
        custoProducao: custoCalculado 
      });
    });
  }, [produtos]);

  const fetchVenda = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendas")
        .select("id, cliente_nome, valor_venda, valor_frete, valor_instalacao, valor_credito, lucro_total, frete_aprovado, comprovante_url, comprovante_nome, lucro_instalacao, custo_instalacao, instalacao_faturada")
        .eq("id", id)
        .single();

      if (error) throw error;
      setVenda(data);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar venda",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLucroItem = async (produtoId: string, lucro: number) => {
    const produto = produtos?.find(p => p.id === produtoId);
    if (!produto) return;

    const custoCalculado = produto.valor_total - lucro;
    await updateLucroItem({ 
      produtoId, 
      lucroItem: lucro,
      custoProducao: custoCalculado 
    });
  };

  const handleFaturar = async () => {
    if (!venda || !produtos) return;
    
    const produtosComLucroZero = produtos.filter(p => 
      (p.lucro_item === 0 || p.lucro_item === null || p.lucro_item === undefined)
    );
    
    if (produtosComLucroZero.length > 0) {
      setShowConfirmDialog(true);
      return;
    }
    
    await executarFaturamento();
  };

  const executarFaturamento = async () => {
    if (!venda || !produtos) return;
    
    const custoTotal = produtos.reduce((acc, p) => 
      acc + (p.custo_producao || 0), 0  // valor já é o total da linha
    );
    const lucroTotal = produtos.reduce((acc, p) => 
      acc + (p.lucro_item || 0), 0  // valor já é o total da linha
    );
    
    // Calcular lucro da instalação (30% se houver valor)
    const valorInstalacao = venda.valor_instalacao || 0;
    const lucroInstalacao = valorInstalacao > 0 ? valorInstalacao * 0.30 : 0;
    const custoInstalacao = valorInstalacao - lucroInstalacao;
    
    const produtosIds = produtos.map(p => p.id);
    
    try {
      await finalizarFaturamento({
        vendaId: venda.id,
        custoTotal,
        lucroTotal,
        produtosIds,
        lucroInstalacao,
        custoInstalacao,
      });
      
      setShowConfirmDialog(false);
      await fetchVenda();
      setShowPedidoDialog(true);
    } catch (error) {
      console.error('Erro ao finalizar faturamento:', error);
    }
  };

  const handleRemoverFaturamento = async () => {
    if (!venda || !id) return;

    try {
      const pedido = await checkExistingPedido(venda.id);
      if (pedido) {
        toast({
          variant: "destructive",
          title: "Não é possível remover o faturamento",
          description: "Existe um pedido de produção vinculado a esta venda. Exclua o pedido primeiro.",
        });
        setShowRemoverFaturamentoDialog(false);
        return;
      }

      await removerFaturamento(id);
      setShowRemoverFaturamentoDialog(false);
      await fetchVenda();
      
      toast({
        title: "Faturamento removido",
        description: "O faturamento foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao remover faturamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover faturamento",
        description: error.message || "Ocorreu um erro ao remover o faturamento.",
      });
    }
  };

  // Cálculos
  const todosProdutosFaturados = produtos?.every(p => p.faturamento === true) || false;
  const vendaFaturada = todosProdutosFaturados && venda?.frete_aprovado === true;
  const lucroProdutos = produtos?.reduce((acc, p) => acc + (p.lucro_item || 0), 0) || 0;  // valor já é o total da linha
  
  // Lucro da instalação: se já faturada usa o valor salvo, senão calcula 30%
  const valorInstalacao = venda?.valor_instalacao || 0;
  const lucroInstalacaoCalculado = valorInstalacao > 0 ? valorInstalacao * 0.30 : 0;
  const lucroInstalacao = venda?.instalacao_faturada 
    ? (venda.lucro_instalacao || 0) 
    : lucroInstalacaoCalculado;
  
  const totalLucro = lucroProdutos + lucroInstalacao;
  const margem = venda && venda.valor_venda > 0 ? (totalLucro / venda.valor_venda) * 100 : 0;
  // Só conta como faturado se lucro_item > 0 OU se o faturamento já foi finalizado
  const produtosFaturados = produtos?.filter(p => 
    p.faturamento === true || (p.lucro_item !== null && p.lucro_item !== undefined && p.lucro_item > 0)
  ).length || 0;
  // Contabilizar instalação se houver
  const temInstalacao = valorInstalacao > 0;
  const totalProdutos = (produtos?.length || 0) + (temInstalacao ? 1 : 0);
  const totalFaturados = produtosFaturados + (temInstalacao && (venda?.instalacao_faturada || lucroInstalacaoCalculado > 0) ? 1 : 0);

  // Descontos e acréscimos
  const totalDescontos = produtos?.reduce((acc, p) => acc + (p.desconto_valor || 0), 0) || 0;
  const valorCredito = venda?.valor_credito || 0;

  const getTipoProdutoLabel = (tipo?: string) => {
    const tipos: Record<string, string> = {
      'porta_enrolar': 'Porta Enrolar',
      'porta_social': 'Porta Social',
      'acessorio': 'Acessório',
      'manutencao': 'Manutenção',
      'adicional': 'Adicional',
      'pintura_epoxi': 'Pintura Epóxi',
    };
    return tipos[tipo || ''] || tipo || '-';
  };

  const breadcrumbItems = [
    { label: "Home", path: "/home" },
    { label: "Administrativo", path: "/administrativo" },
    { label: "Financeiro", path: "/administrativo/financeiro" },
    { label: "Faturamento", path: "/administrativo/financeiro/faturamento" },
    { label: "Por Venda", path: "/administrativo/financeiro/faturamento/vendas" },
    { label: venda?.cliente_nome || "Venda" },
  ];

  if (loading || isLoadingProdutos) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Venda não encontrada</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate('/administrativo/financeiro/faturamento/vendas')}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedBreadcrumb items={breadcrumbItems} mounted={mounted} />
      <FloatingProfileMenu mounted={mounted} />

      <div className="max-w-7xl mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/administrativo/financeiro/faturamento/vendas')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Faturamento</h1>
                {vendaFaturada && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Faturada
                  </Badge>
                )}
              </div>
              <p className="text-white/60">Cliente: {venda.cliente_nome}</p>
            </div>
          </div>

          {vendaFaturada && (
            <div className="flex gap-2">
              {/* Botão Criar Pedido - só aparece se não tem pedido */}
              {hasPedido === false && (
                <Button
                  variant="outline"
                  className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  onClick={() => setShowPedidoDialog(true)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Criar Pedido
                </Button>
              )}
              
              {/* Botão Acessar Pedido - só aparece se já tem pedido */}
              {hasPedido === true && pedidoExistenteId && (
                <Button
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  onClick={() => navigate(`/administrativo/pedidos/${pedidoExistenteId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar Pedido
                </Button>
              )}
              
              {/* Botão Remover Faturamento */}
              <Button
                variant="outline"
                className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                onClick={() => setShowRemoverFaturamentoDialog(true)}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Remover Faturamento
              </Button>
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Lucro Bruto</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(totalLucro)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Margem</CardTitle>
              <Percent className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {margem.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Progresso</CardTitle>
              <Package className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalFaturados}/{totalProdutos}
              </div>
              <p className="text-xs text-white/50">Itens faturados</p>
            </CardContent>
          </Card>
        </div>

        {/* Comprovante Anexado */}
        {venda.comprovante_url && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Receipt className="h-4 w-4 text-blue-400" />
                Comprovante Anexado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{venda.comprovante_nome || 'Comprovante'}</p>
                  <p className="text-xs text-white/50">Arquivo anexado à venda</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.open(venda.comprovante_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Descontos e Acréscimos */}
        {(totalDescontos > 0 || valorCredito > 0) && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Calculator className="h-4 w-4 text-amber-400" />
                Descontos e Acréscimos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <Minus className="h-4 w-4" />
                    <span className="font-medium">Descontos</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(totalDescontos)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {produtos?.filter(p => (p.desconto_valor || 0) > 0).length || 0} produto(s) com desconto
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Acréscimos</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(valorCredito)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Crédito do cliente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Produtos */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-base text-white">Produtos da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Tipo</TableHead>
                    <TableHead className="text-white/70">Produto</TableHead>
                    <TableHead className="text-white/70">Tamanho</TableHead>
                    <TableHead className="text-white/70 text-right">Desconto</TableHead>
                    <TableHead className="text-white/70 text-right">Valor Unit.</TableHead>
                    <TableHead className="text-white/70 text-center">Qtd</TableHead>
                    <TableHead className="text-white/70 text-right">Valor Total</TableHead>
                    <TableHead className="text-white/70 text-right">Lucro</TableHead>
                    <TableHead className="text-white/70 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos?.map((produto) => {
                    const temLucro = produto.lucro_item !== null && produto.lucro_item !== undefined;
                    const valorTotalLinha = produto.valor_total; // Já é o total da linha no banco
                    const valorUnitario = produto.quantidade > 0 ? produto.valor_total / produto.quantidade : 0;
                    const desconto = produto.desconto_percentual 
                      ? `${produto.desconto_percentual}%` 
                      : produto.desconto_valor 
                        ? formatCurrency(produto.desconto_valor)
                        : '-';
                    
                    return (
                      <TableRow key={produto.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-sm text-white/80">
                          {getTipoProdutoLabel(produto.tipo_produto)}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {produto.descricao}
                        </TableCell>
                        <TableCell className="text-white/60">
                          {produto.tamanho || "-"}
                        </TableCell>
                        <TableCell className="text-right text-orange-400">
                          {desconto}
                        </TableCell>
                        <TableCell className="text-right text-white/80">
                          {formatCurrency(valorUnitario)}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {produto.quantidade}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatCurrency(valorTotalLinha)}
                        </TableCell>
                        <TableCell className="text-right">
                          {produto.faturamento ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Faturado
                            </Badge>
                          ) : temLucro ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {formatCurrency(produto.lucro_item!)}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProduto(produto)}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Linha da Instalação (se houver) */}
                  {valorInstalacao > 0 && (
                    <TableRow className="bg-cyan-500/5 border-white/10">
                      <TableCell className="text-sm text-cyan-400">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3" />
                          Instalação
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        Serviço de Instalação
                      </TableCell>
                      <TableCell className="text-white/60">-</TableCell>
                      <TableCell className="text-right text-white/60">-</TableCell>
                      <TableCell className="text-right text-white/80">
                        {formatCurrency(valorInstalacao)}
                      </TableCell>
                      <TableCell className="text-center text-white/80">1</TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {formatCurrency(valorInstalacao)}
                      </TableCell>
                      <TableCell className="text-right">
                        {venda.instalacao_faturada ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Faturado
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {formatCurrency(lucroInstalacaoCalculado)} (30%)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400/50 mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Linha do Frete */}
                  <TableRow className="bg-white/5 border-white/10">
                    <TableCell colSpan={6} className="font-semibold text-white">
                      Frete
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white">
                      {formatCurrency(venda.valor_frete)}
                    </TableCell>
                    <TableCell colSpan={2} className="text-white/50 text-sm">
                      Apenas visualização
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Parcelas / Contas a Receber */}
        {contasReceber.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <CreditCard className="h-4 w-4 text-blue-400" />
                Parcelas / Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const metodoLabels: Record<string, string> = {
                  boleto: 'Boleto', a_vista: 'À Vista', cartao_credito: 'Cartão', dinheiro: 'Dinheiro', pix: 'Pix'
                };
                const grouped = contasReceber.reduce((acc, parcela) => {
                  const key = parcela.metodo_pagamento || 'outros';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(parcela);
                  return acc;
                }, {} as Record<string, any[]>);

                return Object.entries(grouped).map(([metodo, parcelas]: [string, any[]]) => {
                  const subtotal = parcelas.reduce((sum: number, p: any) => sum + (p.valor_parcela || 0), 0);
                  const pagasCount = parcelas.filter((p: any) => p.status === 'pago').length;
                  return (
                    <div key={metodo} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {metodoLabels[metodo] || metodo.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                            {pagasCount}/{parcelas.length} pagas
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white/80">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {parcelas.map((parcela: any) => {
                          const isPago = parcela.status === 'pago';
                          return (
                            <div key={parcela.id} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2 flex flex-col">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Parcela {parcela.numero_parcela}</span>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  isPago ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                )}>
                                  {isPago ? 'Pago' : 'Pendente'}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {formatCurrency(parcela.valor_parcela)}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(parcela.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                              {isPago && parcela.data_pagamento && (
                                <span className="text-xs text-emerald-400/70">
                                  Pago em {format(new Date(parcela.data_pagamento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              )}
                              {!isPago && (
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-auto"
                                  onClick={() => handleUpdatePagamento(parcela.id, 'status', 'pago')}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Marcar como Pago
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <textarea
                        className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/30"
                        placeholder="Observação do grupo..."
                        rows={2}
                        defaultValue={parcelas[0]?.observacoes || ''}
                        onBlur={async (e) => {
                          const newVal = e.target.value;
                          // Salva a observação em todas as parcelas do grupo
                          for (const parcela of parcelas) {
                            if (newVal !== (parcela.observacoes || '')) {
                              await handleUpdatePagamento(parcela.id, 'observacoes', newVal);
                            }
                          }
                        }}
                      />
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
        )}


        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/administrativo/financeiro/faturamento')}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Voltar
          </Button>
          {!vendaFaturada && (
            <Button
              size="lg"
              onClick={handleFaturar}
              disabled={isFinalizandoFaturamento}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isFinalizandoFaturamento ? "Faturando..." : "Faturar"}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Lucro */}
      {selectedProduto && (
        <LucroItemModal
          isOpen={!!selectedProduto}
          onClose={() => setSelectedProduto(null)}
          produto={selectedProduto}
          onSave={handleSaveLucroItem}
          isSaving={isUpdatingLucro}
        />
      )}

      {/* Modal de Confirmação */}
      <ConfirmarFaturamentoDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        produtosComLucroZero={produtos?.filter(p => 
          (p.lucro_item === 0 || p.lucro_item === null || p.lucro_item === undefined)
        ).length || 0}
        onConfirmar={executarFaturamento}
      />

      {/* Modal de Criação de Pedido */}
      <AlertDialog open={showPedidoDialog} onOpenChange={setShowPedidoDialog}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {checkingPedido ? "Verificando..." : "Venda Faturada com Sucesso!"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {checkingPedido 
                ? "Verificando se já existe um pedido para esta venda..." 
                : "Deseja criar o pedido de produção para esta venda agora?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!checkingPedido && (
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setShowPedidoDialog(false)}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Não, criar depois
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  if (!venda) return;
                  
                  setCheckingPedido(true);
                  const pedidoExistente = await checkExistingPedido(venda.id);
                  setCheckingPedido(false);
                  
                  if (pedidoExistente) {
                    setPedidoExistenteId(pedidoExistente);
                    setHasPedido(true);
                    setShowPedidoDialog(false);
                    setShowPedidoDuplicadoDialog(true);
                    return;
                  }
                  
                  setCheckingPedido(true);
                  const pedidoId = await createPedidoFromVenda(venda.id);
                  setCheckingPedido(false);
                  setShowPedidoDialog(false);
                  if (pedidoId) {
                    setHasPedido(true);
                    setPedidoExistenteId(pedidoId);
                    toast({
                      title: "Pedido criado com sucesso!",
                      description: "O pedido está pronto para ser preenchido.",
                    });
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Sim, Criar Pedido
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pedido Duplicado */}
      <AlertDialog open={showPedidoDuplicadoDialog} onOpenChange={setShowPedidoDuplicadoDialog}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Pedido Existente</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Já existe um pedido vinculado a esta venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => navigate('/administrativo/financeiro/faturamento')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (pedidoExistenteId) {
                  navigate(`/administrativo/pedidos/${pedidoExistenteId}`);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Acessar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Remover Faturamento */}
      <AlertDialog open={showRemoverFaturamentoDialog} onOpenChange={setShowRemoverFaturamentoDialog}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-400">
              Remover Faturamento
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-white/60">
                Você está prestes a <strong className="text-white">remover o faturamento</strong> desta venda.
              </p>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 text-sm">
                <p className="font-medium text-orange-400 mb-2">Isso irá:</p>
                <ul className="list-disc list-inside text-orange-300/80 space-y-1">
                  <li>Resetar todos os valores de lucro dos produtos</li>
                  <li>Resetar os custos de produção</li>
                  <li>Permitir que a venda seja editada novamente</li>
                </ul>
              </div>
              <p className="text-sm text-white/50">
                Esta ação não pode ser desfeita automaticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isRemovendo}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoverFaturamento}
              disabled={isRemovendo}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRemovendo ? "Removendo..." : "Sim, Remover Faturamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
