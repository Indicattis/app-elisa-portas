import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";
import { PortasVendaTable } from "@/components/vendas/PortasVendaTable";
import { Checkbox } from "@/components/ui/checkbox";

interface Venda {
  id: string;
  data_venda: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  atendente_id: string;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  resgate: boolean;
  observacoes?: string;
}

export default function FaturamentoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [formData, setFormData] = useState({
    valor_produto: 0,
    custo_produto: 0,
    valor_pintura: 0,
    custo_pintura: 0,
    valor_instalacao: 0,
    valor_frete: 0,
    observacoes: "",
  });
  const [loading, setLoading] = useState(true);

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
      setFormData({
        valor_produto: data.valor_produto || 0,
        custo_produto: data.custo_produto || 0,
        valor_pintura: data.valor_pintura || 0,
        custo_pintura: data.custo_pintura || 0,
        valor_instalacao: data.valor_instalacao || 0,
        valor_frete: data.valor_frete || 0,
        observacoes: data.observacoes_venda || "",
      });
      setLoading(false);
    };

    fetchVenda();
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calcular lucros
    const lucroProduto = formData.valor_produto - formData.custo_produto;
    const lucroPintura = formData.valor_pintura - formData.custo_pintura;
    const lucroTotal = lucroProduto + lucroPintura;

    // Calcular valor total da venda
    const valorVenda = formData.valor_produto + formData.valor_pintura + 
                       formData.valor_instalacao + formData.valor_frete;

    const { error } = await supabase
      .from("vendas")
      .update({
        ...formData,
        observacoes_venda: formData.observacoes,
        lucro_total: lucroTotal,
        valor_venda: valorVenda,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar faturamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar faturamento",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Faturamento atualizado com sucesso",
    });

    navigate("/dashboard/faturamento");
  };

  if (loading) {
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

  const lucroProduto = formData.valor_produto - formData.custo_produto;
  const lucroPintura = formData.valor_pintura - formData.custo_pintura;
  const lucroTotal = lucroProduto + lucroPintura;
  const valorVenda = formData.valor_produto + formData.valor_pintura + 
                     formData.valor_instalacao + formData.valor_frete;
  const margemLucro = valorVenda > 0 ? (lucroTotal / valorVenda) * 100 : 0;

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
        <h1 className="text-3xl font-bold">Editar Faturamento</h1>
        <p className="text-muted-foreground">
          Gerencie custos e valores da venda
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margemLucro.toFixed(1)}%
            </div>
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
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="font-medium">{venda.cliente_nome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Telefone</Label>
              <p className="font-medium">{venda.cliente_telefone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data</Label>
              <p className="font-medium">
                {new Date(venda.data_venda).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos da Venda */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos da Venda</CardTitle>
          <CardDescription>Visualização dos produtos vendidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Os produtos associados a esta venda podem ser visualizados e editados na aba Vendas.
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Faturamento */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Valores e Custos</CardTitle>
            <CardDescription>
              Informe os valores de venda e custos para calcular o lucro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Produto */}
              <div className="space-y-2">
                <Label htmlFor="valor_produto">Valor Produto (R$)</Label>
                <Input
                  id="valor_produto"
                  type="number"
                  step="0.01"
                  value={formData.valor_produto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_produto: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_produto">Custo Produto (R$)</Label>
                <Input
                  id="custo_produto"
                  type="number"
                  step="0.01"
                  value={formData.custo_produto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custo_produto: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Pintura */}
              <div className="space-y-2">
                <Label htmlFor="valor_pintura">Valor Pintura (R$)</Label>
                <Input
                  id="valor_pintura"
                  type="number"
                  step="0.01"
                  value={formData.valor_pintura}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_pintura: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_pintura">Custo Pintura (R$)</Label>
                <Input
                  id="custo_pintura"
                  type="number"
                  step="0.01"
                  value={formData.custo_pintura}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custo_pintura: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Instalação e Frete */}
              <div className="space-y-2">
                <Label htmlFor="valor_instalacao">Valor Instalação (R$)</Label>
                <Input
                  id="valor_instalacao"
                  type="number"
                  step="0.01"
                  value={formData.valor_instalacao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_instalacao: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_frete">Valor Frete (R$)</Label>
                <Input
                  id="valor_frete"
                  type="number"
                  step="0.01"
                  value={formData.valor_frete}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_frete: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/faturamento")}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Faturamento</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
