import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, User, FileText, Scale, Ruler } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { PedidoLinhasEditor } from "@/components/pedidos/PedidoLinhasEditor";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";

export default function PedidoPreparacao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar pedido completo
  const { data: pedido, isLoading: pedidoLoading } = useQuery({
    queryKey: ['pedido-preparacao', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas (
            *,
            produtos_vendas (
              *,
              catalogo_cores (nome, codigo_hex)
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const venda = pedido?.vendas;
  const produtos = venda?.produtos_vendas || [];
  
  // Filtrar apenas portas enrolar
  const portasEnrolar = produtos.filter((p: any) => 
    p.tipo_produto === 'porta_enrolar' && p.largura && p.altura
  );

  // Hook para gerenciar linhas do pedido
  const {
    linhas,
    isLoading: linhasLoading,
    adicionarLinha,
    removerLinha,
    atualizarCheckbox,
  } = usePedidoLinhas(id || '');

  // Calcular peso da porta: ((altura * largura * 12) * 2) * 0.3
  const calcularPeso = (largura: number, altura: number) => {
    return ((altura * largura * 12) * 2) * 0.3;
  };

  // Calcular quantidade de meia canas: Math.ceil(altura / 0.076)
  const calcularMeiaCanas = (altura: number) => {
    return Math.ceil(altura / 0.076);
  };

  if (pedidoLoading || linhasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando preparação...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pedido não encontrado</p>
          <Button onClick={() => navigate('/dashboard/pedidos')}>
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const isReadOnly = pedido.etapa_atual !== 'aberto';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/pedidos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Preparação de Pedido</h1>
            <p className="text-muted-foreground">
              {pedido.numero_pedido}
            </p>
          </div>
        </div>
        <Badge variant={pedido.etapa_atual === 'aberto' ? 'default' : 'secondary'}>
          {pedido.etapa_atual}
        </Badge>
      </div>

      {/* Grid de 2 colunas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Seção 1: Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-base font-semibold">{venda?.cliente_nome}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="text-base">{pedido?.cliente_telefone || venda?.cliente_telefone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CPF</label>
                <p className="text-base">{pedido?.cliente_cpf || '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">E-mail</label>
              <p className="text-base">{pedido?.cliente_email || venda?.cliente_email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Endereço</label>
              <p className="text-base">
                {pedido?.endereco_rua ? (
                  <>
                    {pedido.endereco_rua}, {pedido.endereco_numero || 'S/N'}
                    <br />
                    {pedido.endereco_bairro && `${pedido.endereco_bairro}, `}
                    {pedido.endereco_cidade}/{pedido.endereco_estado}
                    <br />
                    CEP: {pedido.endereco_cep || '-'}
                  </>
                ) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Informações do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número</label>
                <p className="text-base font-semibold">{pedido.numero_pedido}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant="outline">{pedido.etapa_atual}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="text-base">{format(new Date(pedido.created_at), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Entrega</label>
                <p className="text-base">
                  {pedido?.data_entrega ? format(new Date(pedido.data_entrega), "dd/MM/yyyy") : '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Instalação</label>
                <p className="text-base">{pedido?.modalidade_instalacao || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pagamento</label>
                <p className="text-base">{pedido?.forma_pagamento || '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(venda?.valor_venda || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 3: Produtos da Venda com Cálculos */}
      {portasEnrolar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos da Venda (Portas Enrolar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portasEnrolar.map((produto: any, idx: number) => {
                const peso = calcularPeso(produto.largura, produto.altura);
                const meiaCanas = calcularMeiaCanas(produto.altura);
                
                return (
                  <div 
                    key={idx} 
                    className="border rounded-lg p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{produto.descricao || 'Porta Enrolar'}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dimensões:</span>
                            <span className="ml-2 font-medium">
                              {produto.largura}m x {produto.altura}m
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cor:</span>
                            <span className="ml-2 font-medium">
                              {produto.catalogo_cores?.nome || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quantidade:</span>
                            <span className="ml-2 font-medium">{produto.quantidade || 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cálculos */}
                    <div className="flex gap-4 pt-3 border-t">
                      <Badge variant="outline" className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Peso: {peso.toFixed(2)} kg
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Meia Canas: {meiaCanas} un
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 4: Linhas de Preparação */}
      <Card>
        <CardHeader>
          <CardTitle>Linhas de Preparação do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <PedidoLinhasEditor
            linhas={linhas}
            isReadOnly={isReadOnly}
            onAdicionarLinha={adicionarLinha}
            onRemoverLinha={removerLinha}
            onAtualizarCheckbox={(linhaId, campo, valor) => 
              atualizarCheckbox({ linhaId, campo, valor })
            }
          />
        </CardContent>
      </Card>

      {/* Ações do Pedido */}
      <div className="flex gap-3 justify-end pb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/pedidos')}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
