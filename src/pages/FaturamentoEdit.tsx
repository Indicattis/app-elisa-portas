import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, TrendingUp, Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { usePortasVenda } from "@/hooks/usePortasVenda";
import { FaturamentoItemCard } from "@/components/vendas/FaturamentoItemCard";

interface Venda {
  id: string;
  data_venda: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  valor_venda: number;
  valor_frete: number;
  valor_instalacao?: number;
  valor_entrada?: number;
  forma_pagamento?: string;
  publico_alvo?: string;
  data_prevista_entrega?: string;
  frete_aprovado: boolean;
  canal_aquisicao_id?: string;
}

export default function FaturamentoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const [freteAprovado, setFreteAprovado] = useState(false);
  const [isSavingFrete, setIsSavingFrete] = useState(false);
  
  const { portas, isLoading: loadingPortas, updateLucroItem, isUpdatingLucros } = usePortasVenda(id);
  const [canalAquisicao, setCanalAquisicao] = useState<string>('');

  useEffect(() => {
    const fetchVenda = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("vendas")
        .select(`
          *,
          canal_aquisicao:canais_aquisicao(nome)
        `)
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
      setFreteAprovado(data.frete_aprovado || false);
      if (data.canal_aquisicao) {
        setCanalAquisicao((data.canal_aquisicao as any)?.nome || '');
      }
      setLoading(false);
    };

    fetchVenda();
  }, [id, toast]);

  const handleToggleFreteAprovado = async (checked: boolean) => {
    if (!id) return;
    
    setIsSavingFrete(true);
    try {
      const { error } = await supabase
        .from("vendas")
        .update({ frete_aprovado: checked })
        .eq("id", id);

      if (error) throw error;

      setFreteAprovado(checked);
      toast({
        title: checked ? "Frete aprovado" : "Aprovação removida",
        description: checked 
          ? "O valor do frete foi aprovado para faturamento" 
          : "A aprovação do frete foi removida",
      });
    } catch (error) {
      console.error("Erro ao atualizar aprovação do frete:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a aprovação do frete",
      });
    } finally {
      setIsSavingFrete(false);
    }
  };

  const handleSaveItemLucro = async (itemId: string, lucro: number) => {
    if (!freteAprovado) {
      toast({
        variant: "destructive",
        title: "Frete não aprovado",
        description: "É necessário aprovar o frete antes de faturar os produtos",
      });
      return;
    }
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
  const todosFaturados = itensFaturados === totalItens && totalItens > 0;
  const vendaCompletamenteFaturada = todosFaturados && freteAprovado;

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

      {/* Aprovação de Frete */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Aprovação de Frete</CardTitle>
              <CardDescription>
                O frete deve ser aprovado antes de faturar os produtos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="frete-aprovado" className="text-base font-medium cursor-pointer">
                  Valor do Frete
                </Label>
                {freteAprovado && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-primary">
                R$ {(venda.valor_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="frete-aprovado"
                checked={freteAprovado}
                onCheckedChange={handleToggleFreteAprovado}
                disabled={isSavingFrete}
                className="h-6 w-6"
              />
              <Label htmlFor="frete-aprovado" className="text-base font-medium cursor-pointer">
                {freteAprovado ? "Frete Aprovado" : "Aprovar Frete"}
              </Label>
            </div>
          </div>

          {!freteAprovado && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O frete precisa ser aprovado antes de faturar os produtos desta venda.
              </AlertDescription>
            </Alert>
          )}

          {vendaCompletamenteFaturada && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Venda completamente faturada! Frete aprovado e todos os produtos com lucro definido.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações da Venda */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Cliente</p>
              <p className="font-medium">{venda.cliente_nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Telefone</p>
              <p className="font-medium">{venda.cliente_telefone}</p>
            </div>
            {venda.cliente_email && (
              <div>
                <p className="text-muted-foreground text-xs">E-mail</p>
                <p className="font-medium">{venda.cliente_email}</p>
              </div>
            )}
            {venda.cidade && (
              <div>
                <p className="text-muted-foreground text-xs">Cidade/Estado</p>
                <p className="font-medium">{venda.cidade}/{venda.estado}</p>
              </div>
            )}
            {venda.bairro && (
              <div>
                <p className="text-muted-foreground text-xs">Bairro</p>
                <p className="font-medium">{venda.bairro}</p>
              </div>
            )}
            {venda.cep && (
              <div>
                <p className="text-muted-foreground text-xs">CEP</p>
                <p className="font-medium">{venda.cep}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">Data da Venda</p>
              <p className="font-medium">
                {new Date(venda.data_venda).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {venda.data_prevista_entrega && (
              <div>
                <p className="text-muted-foreground text-xs">Previsão de Entrega</p>
                <p className="font-medium">
                  {new Date(venda.data_prevista_entrega).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
            {venda.forma_pagamento && (
              <div>
                <p className="text-muted-foreground text-xs">Forma de Pagamento</p>
                <p className="font-medium">{venda.forma_pagamento}</p>
              </div>
            )}
            {venda.valor_entrada !== undefined && venda.valor_entrada > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">Valor de Entrada</p>
                <p className="font-medium">
                  R$ {venda.valor_entrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {venda.valor_instalacao !== undefined && venda.valor_instalacao > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">Valor de Instalação</p>
                <p className="font-medium">
                  R$ {venda.valor_instalacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {canalAquisicao && (
              <div>
                <p className="text-muted-foreground text-xs">Canal de Aquisição</p>
                <p className="font-medium">{canalAquisicao}</p>
              </div>
            )}
            {venda.publico_alvo && (
              <div>
                <p className="text-muted-foreground text-xs">Público Alvo</p>
                <p className="font-medium">{venda.publico_alvo}</p>
              </div>
            )}
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
                freteAprovado={freteAprovado}
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
