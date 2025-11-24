import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProdutosVenda } from "@/hooks/useProdutosVenda";
import { LucroItemModal } from "@/components/vendas/LucroItemModal";
import { FaturamentoProdutosTable } from "@/components/vendas/FaturamentoProdutosTable";
import { ConfirmarFaturamentoDialog } from "@/components/vendas/ConfirmarFaturamentoDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePedidoCreation } from "@/hooks/usePedidoCreation";

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
  const [showPedidoDialog, setShowPedidoDialog] = useState(false);
  const [showPedidoDuplicadoDialog, setShowPedidoDuplicadoDialog] = useState(false);
  const [pedidoExistenteId, setPedidoExistenteId] = useState<string | null>(null);
  const [checkingPedido, setCheckingPedido] = useState(false);
  const { createPedidoFromVenda, checkExistingPedido } = usePedidoCreation();

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
      acc + ((p.custo_producao || 0) * p.quantidade), 0
    );
    const lucroTotal = produtos.reduce((acc, p) => 
      acc + ((p.lucro_item || 0) * p.quantidade), 0
    );
    
    const produtosIds = produtos.map(p => p.id);
    
    try {
      await finalizarFaturamento({
        vendaId: venda.id,
        custoTotal,
        lucroTotal,
        produtosIds,
      });
      
      setShowConfirmDialog(false);
      
      // Mostrar dialog perguntando se quer criar pedido
      setShowPedidoDialog(true);
    } catch (error) {
      console.error('Erro ao finalizar faturamento:', error);
    }
  };

  // Cálculos
  const todosProdutosFaturados = produtos?.every(p => p.lucro_item !== null && p.lucro_item !== undefined) || false;
  const totalLucro = produtos?.reduce((acc, p) => acc + ((p.lucro_item || 0) * p.quantidade), 0) || 0;
  const totalCusto = produtos?.reduce((acc, p) => acc + ((p.custo_producao || 0) * p.quantidade), 0) || 0;
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
      <div>
        <h1 className="text-3xl font-bold">Faturamento - Venda {venda.numero_venda ? `#${venda.numero_venda}` : ''}</h1>
        <p className="text-muted-foreground">
          Cliente: {venda.cliente_nome}
        </p>
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
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/dashboard/faturamento')}
        >
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={handleFaturar}
          disabled={isFinalizandoFaturamento}
        >
          {isFinalizandoFaturamento ? "Faturando..." : "Faturar"}
        </Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {checkingPedido ? "Verificando..." : "Venda Faturada com Sucesso!"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {checkingPedido 
                ? "Verificando se já existe um pedido para esta venda..." 
                : "Deseja criar o pedido de produção para esta venda agora?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!checkingPedido && (
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => navigate('/dashboard/faturamento')}>
                Não, criar depois
              </AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (!venda) return;
                
                // Primeiro verificar se já existe
                setCheckingPedido(true);
                const pedidoExistente = await checkExistingPedido(venda.id);
                setCheckingPedido(false);
                
                if (pedidoExistente) {
                  setPedidoExistenteId(pedidoExistente);
                  setShowPedidoDialog(false);
                  setShowPedidoDuplicadoDialog(true);
                  return;
                }
                
                // Se não existe, criar
                const pedidoId = await createPedidoFromVenda(venda.id);
                setShowPedidoDialog(false);
                if (pedidoId) {
                  toast({
                    title: "Pedido criado com sucesso!",
                    description: "O pedido está pronto para ser preenchido.",
                  });
                  navigate(`/dashboard/pedido/${pedidoId}/view`);
                } else {
                  navigate('/dashboard/faturamento');
                }
              }}>
                Sim, Criar Pedido
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pedido Duplicado */}
      <AlertDialog open={showPedidoDuplicadoDialog} onOpenChange={setShowPedidoDuplicadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pedido Existente</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um pedido vinculado a esta venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/dashboard/faturamento')}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pedidoExistenteId) {
                navigate(`/dashboard/pedido/${pedidoExistenteId}/view`);
              }
            }}>
              Acessar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
