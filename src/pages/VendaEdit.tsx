import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCanEditVenda } from "@/hooks/useCanEditVenda";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, User, Phone, Mail, MapPin, Calendar, CreditCard, Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useProdutosVenda } from "@/hooks/useProdutosVenda";
import { ProdutoVendaForm } from "@/components/vendas/ProdutoVendaForm";
import { ProdutosVendaTable } from "@/components/vendas/ProdutosVendaTable";
import type { ProdutoVenda } from "@/hooks/useVendas";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VendaEdit() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const { produtos, isLoading: isLoadingProdutos, addProduto, deleteProduto } = useProdutosVenda(id);

  const { user, isAdmin } = useAuth();
  const { canEdit, loading: loadingPermission, isFaturada } = useCanEditVenda({
    atendenteId: venda?.atendente_id,
    vendaId: id,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVenda();
    }
  }, [id]);

  const fetchVenda = async () => {
    if (!id) return;
    
    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      setVenda(vendaData);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da venda",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      boleto: "Boleto",
      a_vista: "À Vista (PIX/Débito)",
      cartao_credito: "Cartão de Crédito",
      dinheiro: "Dinheiro",
    };
    return labels[forma] || forma;
  };

  // Calcular valor total dos produtos
  const valorTotalProdutos = produtos?.reduce((acc, p) => {
    const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * p.quantidade;
    const desconto = p.tipo_desconto === 'valor' ? p.desconto_valor : valorBase * (p.desconto_percentual / 100);
    return acc + valorBase - desconto;
  }, 0) || 0;

  if (loadingPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              {isFaturada 
                ? "Esta venda já foi totalmente faturada e não pode mais ser editada."
                : "Você não tem permissão para editar esta venda. Apenas o atendente responsável ou administradores podem editar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Produtos da Venda</h1>
          <p className="text-muted-foreground">Adicione ou remova produtos desta venda</p>
        </div>
      </div>

      {/* Dados da Venda (somente leitura) */}
      {venda && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{venda.cliente_nome}</span>
              </div>
              {venda.cliente_telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{venda.cliente_telefone}</span>
                </div>
              )}
              {venda.cliente_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{venda.cliente_email}</span>
                </div>
              )}
              {(venda.cidade || venda.estado) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{[venda.cidade, venda.estado].filter(Boolean).join(" - ")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados da Venda */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Dados da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(new Date(venda.data_venda), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              {venda.forma_pagamento && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>{getFormaPagamentoLabel(venda.forma_pagamento)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={venda.venda_presencial ? "default" : "secondary"}>
                  {venda.venda_presencial ? "Presencial" : "Online"}
                </Badge>
                {venda.tipo_entrega && (
                  <Badge variant="outline" className="capitalize">
                    {venda.tipo_entrega.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Valor Total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Valor Total dos Produtos</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(valorTotalProdutos)}
            </span>
          </div>
          {venda?.valor_frete && venda.valor_frete > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
              <span>+ Frete</span>
              <span>{formatCurrency(venda.valor_frete)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos da Venda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos da Venda</CardTitle>
              <CardDescription>
                Adicione, edite ou remova produtos. Os valores dos produtos não podem ser alterados.
              </CardDescription>
            </div>
            <Button onClick={() => setShowProdutoForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProdutoVendaForm 
            open={showProdutoForm}
            onOpenChange={setShowProdutoForm}
            onAddProduto={async (produto: ProdutoVenda) => {
              if (!id) return;
              await addProduto({ ...produto, venda_id: id });
              setShowProdutoForm(false);
              toast({
                title: "Produto adicionado",
                description: "O produto foi adicionado à venda com sucesso.",
              });
            }}
          />
          
          {isLoadingProdutos ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando produtos...
            </div>
          ) : produtos && produtos.length > 0 ? (
            <ProdutosVendaTable 
              produtos={(produtos || []).map(p => ({
                tipo_produto: p.tipo_produto as 'porta' | 'acessorio' | 'adicional',
                tamanho: p.tamanho || '',
                cor_id: p.cor_id || '',
                acessorio_id: p.acessorio_id || '',
                adicional_id: p.adicional_id || '',
                valor_produto: p.valor_produto,
                valor_pintura: p.valor_pintura,
                valor_instalacao: p.valor_instalacao,
                valor_frete: p.valor_frete,
                tipo_desconto: p.tipo_desconto as 'percentual' | 'valor',
                desconto_percentual: p.desconto_percentual,
                desconto_valor: p.desconto_valor,
                quantidade: p.quantidade,
                descricao: p.descricao || ''
              }))} 
              onRemoveProduto={async (index: number) => {
                const produto = produtos?.[index];
                if (produto?.id) {
                  await deleteProduto(produto.id);
                  toast({
                    title: "Produto removido",
                    description: "O produto foi removido da venda.",
                  });
                }
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum produto adicionado</p>
              <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Voltar */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/dashboard/vendas/${id}`)}>
          Ver Detalhes da Venda
        </Button>
        <Button onClick={() => navigate("/dashboard/vendas")}>
          Voltar para Vendas
        </Button>
      </div>
    </div>
  );
}
