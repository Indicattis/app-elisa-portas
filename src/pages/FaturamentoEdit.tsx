import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent, Package, Undo2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useProdutosVenda } from "@/hooks/useProdutosVenda";
import { useFaturamento } from "@/hooks/useFaturamento";
import { LucroItemModal } from "@/components/vendas/LucroItemModal";
import { FaturamentoProdutosTable } from "@/components/vendas/FaturamentoProdutosTable";
import { ConfirmarFaturamentoDialog } from "@/components/vendas/ConfirmarFaturamentoDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Venda {
  id: string;
  numero_venda?: number;
  cliente_nome: string;
  valor_venda: number;
  valor_frete: number;
  lucro_total: number;
  frete_aprovado: boolean;
}

export default function FaturamentoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<any | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRemoverFaturamentoDialog, setShowRemoverFaturamentoDialog] = useState(false);
  const [valorAReceber, setValorAReceber] = useState('');
  const { removerFaturamento, isRemovendo, verificarFaturamento } = useFaturamento();

  const {
    produtos,
    isLoading: isLoadingProdutos,
    updateLucroItem,
    isUpdatingLucro,
    finalizarFaturamento,
    isFinalizandoFaturamento,
  } = useProdutosVenda(id);

  useEffect(() => {
    if (id) {
      fetchVenda();
    }
  }, [id]);

  const fetchVenda = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendas")
        .select("*")
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
    
    // Verificar se há produtos com lucro = 0
    const produtosComLucroZero = produtos.filter(p => 
      (p.lucro_item === 0 || p.lucro_item === null || p.lucro_item === undefined)
    );
    
    // Se houver produtos com lucro zero, mostrar confirmação
    if (produtosComLucroZero.length > 0) {
      setShowConfirmDialog(true);
      return;
    }
    
    // Se não houver, prosseguir diretamente
    await executarFaturamento();
  };

  const executarFaturamento = async () => {
    if (!venda || !produtos) return;
    
    const custoTotal = produtos.reduce((acc, p) => 
      acc + (p.custo_producao || 0), 0  // valor_total já é o total da linha
    );
    const lucroTotal = produtos.reduce((acc, p) => 
      acc + (p.lucro_item || 0), 0  // lucro_item já é o total da linha
    );
    
    const produtosIds = produtos.map(p => p.id);
    
    try {
      setShowConfirmDialog(false);
      
      await finalizarFaturamento({
        vendaId: venda.id,
        custoTotal,
        lucroTotal,
        produtosIds,
        valorAReceber: parseFloat(valorAReceber) || 0,
      });
      
      // Recarregar dados da venda para atualizar o estado
      await fetchVenda();
      
      toast({
        title: "Venda faturada com sucesso!",
        description: "Os valores de lucro e custo foram calculados e salvos.",
      });
    } catch (error) {
      console.error('Erro ao finalizar faturamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao faturar",
        description: "Ocorreu um erro ao finalizar o faturamento.",
      });
    }
  };

  const handleRemoverFaturamento = async () => {
    if (!venda || !id) return;

    try {
      // Verificar se existe pedido usando verificarFaturamento
      const { hasPedido } = await verificarFaturamento(venda.id);
      if (hasPedido) {
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
      
      // Recarregar dados da venda
      await fetchVenda();
      
      toast({
        title: "Faturamento removido",
        description: "O faturamento foi removido com sucesso. A venda pode ser editada novamente.",
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
  const totalLucro = produtos?.reduce((acc, p) => acc + (p.lucro_item || 0), 0) || 0;
  const totalCusto = produtos?.reduce((acc, p) => acc + (p.custo_producao || 0), 0) || 0;
  const margem = venda && venda.valor_venda > 0 ? (totalLucro / venda.valor_venda) * 100 : 0;
  const produtosFaturados = produtos?.filter(p => p.lucro_item !== null && p.lucro_item !== undefined).length || 0;
  const totalProdutos = produtos?.length || 0;

  if (loading || isLoadingProdutos) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Venda não encontrada</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Faturamento - Venda {venda.numero_venda ? `#${venda.numero_venda}` : ''}</h1>
            {vendaFaturada && (
              <Badge variant="default" className="bg-green-600">Faturada</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Cliente: {venda.cliente_nome}
          </p>
        </div>
        
        {/* Botão de Remover Faturamento */}
        {vendaFaturada && (
          <Button
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
            onClick={() => setShowRemoverFaturamentoDialog(true)}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Remover Faturamento
          </Button>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {venda.valor_venda.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalLucro.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {margem.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtosFaturados}/{totalProdutos}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos faturados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Produtos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Produtos da Venda</h2>
        <FaturamentoProdutosTable
          produtos={produtos || []}
          valorFrete={venda.valor_frete}
          onEditLucro={(produto) => setSelectedProduto(produto)}
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex items-end justify-end gap-4">
        {!vendaFaturada && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Valor a Receber (R$)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorAReceber}
              onChange={(e) => setValorAReceber(e.target.value)}
              className="w-48"
            />
          </div>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
        {!vendaFaturada && (
          <Button
            size="lg"
            onClick={handleFaturar}
            disabled={isFinalizandoFaturamento}
          >
            {isFinalizandoFaturamento ? "Faturando..." : "Faturar"}
          </Button>
        )}
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

      {/* Modal de Remover Faturamento */}
      <AlertDialog open={showRemoverFaturamentoDialog} onOpenChange={setShowRemoverFaturamentoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600">
              Remover Faturamento
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a <strong>remover o faturamento</strong> desta venda.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm">
                <p className="font-medium text-orange-800 mb-2">Isso irá:</p>
                <ul className="list-disc list-inside text-orange-700 space-y-1">
                  <li>Resetar todos os valores de lucro dos produtos</li>
                  <li>Resetar os custos de produção</li>
                  <li>Permitir que a venda seja editada novamente</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita automaticamente. Você precisará faturar a venda novamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovendo}>
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
