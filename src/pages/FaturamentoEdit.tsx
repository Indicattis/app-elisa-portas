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

    // Calcular totais apenas dos produtos que têm lucro definido
    const custoTotal = produtos.reduce((acc, p) => 
      acc + ((p.custo_producao || 0) * p.quantidade), 0
    );
    const lucroTotal = produtos.reduce((acc, p) => 
      acc + ((p.lucro_item || 0) * p.quantidade), 0
    );

    // Salvar faturamento
    await finalizarFaturamento({
      vendaId: venda.id,
      custoTotal,
      lucroTotal,
    });

    // Redirecionar
    navigate('/dashboard/faturamento');
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
    </div>
  );
}
