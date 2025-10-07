import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, TrendingUp, Package } from "lucide-react";
import { usePortasVenda } from "@/hooks/usePortasVenda";
import { FaturamentoItemCard } from "@/components/vendas/FaturamentoItemCard";

interface Venda {
  id: string;
  data_venda: string;
  cliente_nome: string;
  cliente_telefone: string;
  valor_venda: number;
}

export default function FaturamentoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { portas, isLoading: loadingPortas, updateLucroItem, isUpdatingLucros } = usePortasVenda(id);

  useEffect(() => {
    const fetchVenda = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar venda:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar venda",
        });
        return;
      }

      setVenda(data);
      setLoading(false);
    };

    fetchVenda();
  }, [id, toast]);

  const handleSaveItemLucro = async (itemId: string, lucro: number) => {
    await updateLucroItem({ portaId: itemId, lucro_item: lucro });
  };

  if (loading || loadingPortas) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Venda não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calcular totais agregados
  const totalLucro = portas?.reduce((acc, p) => acc + (p.lucro_item || 0), 0) || 0;
  const totalValor = portas?.reduce((acc, p) => acc + p.valor_total, 0) || 0;
  const totalCusto = totalValor - totalLucro;
  const margemMedia = totalValor > 0 ? (totalLucro / totalValor) * 100 : 0;

  // Contar itens faturados
  const itensFaturados = portas?.filter(p => (p.lucro_item || 0) > 0).length || 0;
  const totalItens = portas?.length || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard/faturamento")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Faturamento por Item</h1>
        <p className="text-muted-foreground">
          Informe o lucro real de cada produto vendido
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
              R$ {venda.valor_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margemMedia >= 30 ? 'text-green-600' : margemMedia >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
              {margemMedia.toFixed(1)}%
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
              {itensFaturados}/{totalItens}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens faturados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Venda */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{venda.cliente_nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{venda.cliente_telefone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">
                {new Date(venda.data_venda).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Produtos da Venda</h2>
          {itensFaturados < totalItens && (
            <p className="text-sm text-muted-foreground">
              {totalItens - itensFaturados} {totalItens - itensFaturados === 1 ? 'item pendente' : 'itens pendentes'}
            </p>
          )}
        </div>

        {portas && portas.length > 0 ? (
          <div className="space-y-3">
            {portas.map((porta) => (
              <FaturamentoItemCard
                key={porta.id}
                item={{
                  id: porta.id,
                  tipo_produto: porta.tipo_produto,
                  descricao: porta.descricao || 'Produto',
                  quantidade: porta.quantidade,
                  valor_total: porta.valor_total,
                  lucro_item: porta.lucro_item,
                }}
                onSave={handleSaveItemLucro}
                isSaving={isUpdatingLucros}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum produto encontrado nesta venda
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumo Final */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Resumo de Custos e Lucros</CardTitle>
          <CardDescription>Valores totais calculados automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Custo Total</p>
              <p className="text-lg font-semibold">
                R$ {totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucro Total</p>
              <p className="text-lg font-semibold text-green-600">
                R$ {totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margem Média</p>
              <p className={`text-lg font-semibold ${margemMedia >= 30 ? 'text-green-600' : margemMedia >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                {margemMedia.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
