
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCanEditVenda } from "@/hooks/useCanEditVenda";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ShoppingCart, Calendar, User, MapPin, CreditCard, Truck, MessageSquare, Store } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useProdutosVenda } from "@/hooks/useProdutosVenda";
import { ProdutoVendaForm } from "@/components/vendas/ProdutoVendaForm";
import { ProdutosVendaTable } from "@/components/vendas/ProdutosVendaTable";
import type { ProdutoVenda } from "@/hooks/useVendas";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
}

export default function VendaEdit() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const { produtos, isLoading: isLoadingProdutos, addProduto, deleteProduto } = useProdutosVenda(id);
  const { canais } = useCanaisAquisicao();

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

  const { data: produtosAvulsos = [] } = useQuery({
    queryKey: ['produtos-comercializaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('ativo', true)
        .order('nome_produto');
      
      if (error) throw error;
      return data;
    }
  });

  const handleAdicionarProdutoAvulso = async (produtoEstoque: any) => {
    if (!id) return;
    
    try {
      await addProduto({
        venda_id: id,
        tipo_produto: 'adicional',
        descricao: produtoEstoque.nome_produto,
        valor_produto: produtoEstoque.custo_unitario,
        quantidade: 1,
        valor_pintura: 0,
        valor_instalacao: 0,
        valor_frete: 0,
        tipo_desconto: 'percentual',
        desconto_percentual: 0,
        desconto_valor: 0,
      });
      
      toast({
        title: "Produto adicionado",
        description: `${produtoEstoque.nome_produto} foi adicionado à venda`
      });
    } catch (error) {
      console.error('Erro ao adicionar produto avulso:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o produto"
      });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const getPublicoAlvoLabel = (value: string | null | undefined) => {
    const labels: Record<string, string> = {
      'cliente_final': 'Cliente Final',
      'serralheiro': 'Serralheiro',
      'empresa': 'Empresa',
    };
    return value ? labels[value] || value : "-";
  };

  const getTipoEntregaLabel = (value: string | null | undefined) => {
    const labels: Record<string, string> = {
      'instalacao': 'Instalação',
      'retirada': 'Retirada',
      'entrega': 'Entrega',
      'correcao': 'Correção',
      'servico': 'Serviço',
    };
    return value ? labels[value] || value : "-";
  };

  const getCanalNome = (canalId: string | null | undefined) => {
    if (!canalId) return "-";
    const canal = canais.find(c => c.id === canalId);
    return canal?.nome || "-";
  };

  if (!canEdit && !loadingPermission) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              {isFaturada 
                ? "Esta venda já foi totalmente faturada e não pode mais ser editada por atendentes."
                : "Você não tem permissão para editar esta venda."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando dados da venda...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold text-foreground">Editar Venda</h1>
          <p className="text-muted-foreground">Gerencie os produtos desta venda</p>
        </div>
      </div>

      {lead && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nome:</strong> {lead.nome}</div>
              <div><strong>Email:</strong> {lead.email}</div>
              <div><strong>Telefone:</strong> {lead.telefone}</div>
              <div><strong>Cidade:</strong> {lead.cidade}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados da Venda - Somente Visualização */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
          <CardDescription>
            Informações da venda (somente visualização)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cliente */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Cliente
              </div>
              <p className="font-medium">{venda.cliente_nome || "-"}</p>
              <p className="text-sm text-muted-foreground">{venda.cliente_telefone || "-"}</p>
              {venda.cliente_email && (
                <p className="text-sm text-muted-foreground">{venda.cliente_email}</p>
              )}
              {venda.cpf_cliente && (
                <p className="text-sm text-muted-foreground">CPF: {venda.cpf_cliente}</p>
              )}
            </div>

            {/* Data e Público */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data da Venda
              </div>
              <p className="font-medium">{formatDate(venda.data_venda)}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{getPublicoAlvoLabel(venda.publico_alvo)}</Badge>
                {venda.venda_presencial && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    Presencial
                  </Badge>
                )}
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Pagamento
              </div>
              <p className="font-medium">{venda.forma_pagamento || "-"}</p>
              {venda.valor_entrada != null && venda.valor_entrada > 0 && (
                <p className="text-sm text-muted-foreground">
                  Entrada: {formatCurrency(venda.valor_entrada)}
                </p>
              )}
              {venda.numero_parcelas && (
                <p className="text-sm text-muted-foreground">
                  {venda.numero_parcelas}x parcelas
                </p>
              )}
            </div>

            {/* Entrega */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Truck className="h-4 w-4" />
                Entrega
              </div>
              <p className="font-medium">{getTipoEntregaLabel(venda.tipo_entrega)}</p>
              {venda.valor_frete != null && venda.valor_frete > 0 && (
                <p className="text-sm text-muted-foreground">
                  Frete: {formatCurrency(venda.valor_frete)}
                </p>
              )}
              {venda.data_prevista_entrega && (
                <p className="text-sm text-muted-foreground">
                  Previsão: {formatDateOnly(venda.data_prevista_entrega)}
                </p>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Endereço
              </div>
              <p className="font-medium">
                {venda.cidade && venda.estado 
                  ? `${venda.cidade} - ${venda.estado}` 
                  : venda.cidade || venda.estado || "-"}
              </p>
              {venda.bairro && (
                <p className="text-sm text-muted-foreground">{venda.bairro}</p>
              )}
              {venda.cep && (
                <p className="text-sm text-muted-foreground">CEP: {venda.cep}</p>
              )}
            </div>

            {/* Canal de Aquisição */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Canal de Aquisição
              </div>
              <p className="font-medium">{getCanalNome(venda.canal_aquisicao_id)}</p>
            </div>
          </div>

          {/* Observações */}
          {venda.observacoes_venda && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MessageSquare className="h-4 w-4" />
                Observações
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{venda.observacoes_venda}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos Avulsos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Produtos Avulsos Disponíveis
          </CardTitle>
          <CardDescription>
            Clique para adicionar produtos avulsos à venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtosAvulsos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {produtosAvulsos.map((produto) => (
                <Card 
                  key={produto.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleAdicionarProdutoAvulso(produto)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {produto.nome_produto}
                        </p>
                        {produto.descricao_produto && (
                          <p className="text-xs text-muted-foreground truncate">
                            {produto.descricao_produto}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            R$ {produto.custo_unitario.toFixed(2)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {produto.quantidade} {produto.unidade}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdicionarProdutoAvulso(produto);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum produto disponível para venda avulsa. Configure produtos no módulo de Estoque.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => setShowProdutoForm(true)}>
            Adicionar Produto
          </Button>

          <ProdutoVendaForm 
            open={showProdutoForm}
            onOpenChange={setShowProdutoForm}
            onAddProduto={async (produto: ProdutoVenda) => {
              if (!id) return;
              await addProduto({ ...produto, venda_id: id });
              setShowProdutoForm(false);
            }}
          />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Produtos Adicionados</h3>
            {isLoadingProdutos ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : (
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
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
