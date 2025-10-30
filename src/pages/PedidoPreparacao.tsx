import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Phone, MapPin, Hash, Package, CreditCard } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { LinhasCategorizadas } from "@/components/pedidos/LinhasCategorizadas";
import { useEffect } from "react";

export default function PedidoPreparacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: pedido, isLoading: pedidoLoading } = useQuery({
    queryKey: ['pedido-preparacao', id],
    queryFn: async () => {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('*')
        .eq('id', id)
        .single();

      if (pedidoError) throw pedidoError;

      // Buscar venda separadamente com produtos e cores
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          *,
          produtos_vendas (
            *,
            cor:catalogo_cores(nome, codigo_hex)
          )
        `)
        .eq('id', pedidoData.venda_id)
        .single();

      if (vendaError) throw vendaError;

      return {
        ...pedidoData,
        vendas: vendaData
      };
    },
    enabled: !!id
  });

  const {
    linhas,
    isLoading: linhasLoading,
    adicionarLinha,
    removerLinha,
    popularLinhasSeparacao,
  } = usePedidoLinhas(id || '');

  // Popular automaticamente linhas de separação ao carregar
  useEffect(() => {
    if (pedido?.venda_id && linhas.length === 0) {
      popularLinhasSeparacao(pedido.venda_id).catch(() => {
        // Silenciar erro se já existirem linhas
      });
    }
  }, [pedido?.venda_id, linhas.length]);

  if (pedidoLoading || linhasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm text-muted-foreground">Pedido não encontrado</p>
        <Button onClick={() => navigate('/dashboard/pedidos')} variant="outline" size="sm">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Voltar
        </Button>
      </div>
    );
  }

  const venda = pedido.vendas;
  const produtos = venda?.produtos_vendas || [];
  
  // Filtrar portas enrolar e pinturas
  const portasEnrolarEPinturas = produtos.filter((p: any) => 
    p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'pintura_epoxi'
  );

  const calcularPeso = (produto: any) => {
    if (produto.largura && produto.altura) {
      return (((produto.largura * produto.altura * 12) * 2) * 0.3).toFixed(1);
    }
    // Fallback para medidas em string
    if (produto.tamanho) {
      const match = produto.tamanho.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
      if (match) {
        const largura = parseFloat(match[1]);
        const altura = parseFloat(match[2]);
        return (((largura * altura * 12) * 2) * 0.3).toFixed(1);
      }
    }
    return null;
  };

  const calcularMeiaCanas = (produto: any) => {
    if (produto.altura) {
      return (produto.altura / 0.076).toFixed(2);
    }
    // Fallback para medidas em string
    if (produto.tamanho) {
      const match = produto.tamanho.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
      if (match) {
        const altura = parseFloat(match[2]);
        return (altura / 0.076).toFixed(2);
      }
    }
    return null;
  };

  const isReadOnly = pedido.etapa_atual !== 'aberto';

  return (
    <div className="container mx-auto py-4 space-y-3 max-w-6xl">
      {/* Header Compacto */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/pedidos')}
            className="h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Voltar
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-semibold">Preparação {pedido.numero_pedido}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          {pedido.etapa_atual}
        </Badge>
      </div>

      {/* Grid Cliente/Pedido Compacto */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{venda?.cliente_nome}</p>
              </div>
            </div>
            {venda?.cliente_telefone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">{venda.cliente_telefone}</p>
              </div>
            )}
            {(venda?.cep || venda?.cidade) && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {venda.cep && `${venda.cep} - `}
                  {venda.bairro && `${venda.bairro}, `}
                  {venda.cidade && `${venda.cidade}`}
                  {venda.estado && `/${venda.estado}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              Pedido & Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Número</p>
                <p className="font-medium">{pedido.numero_pedido}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Venda</p>
                <p className="font-medium">#{pedido.numero_pedido}</p>
              </div>
              {venda?.valor_venda && (
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_venda)}
                  </p>
                </div>
              )}
              {venda?.created_at && (
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Informações de Pagamento */}
            {venda?.forma_pagamento && (
              <div className="pt-2 border-t space-y-1.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">Pagamento</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Forma</p>
                    <p className="font-medium capitalize">
                      {venda.forma_pagamento.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {venda.valor_entrada !== null && venda.valor_entrada > 0 && (
                    <div>
                      <p className="text-muted-foreground">Entrada</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_entrada)}
                      </p>
                    </div>
                  )}
                  {venda.numero_parcelas && venda.numero_parcelas > 1 && (
                    <div>
                      <p className="text-muted-foreground">Parcelas</p>
                      <p className="font-medium">{venda.numero_parcelas}x</p>
                    </div>
                  )}
                  {venda.valor_a_receber !== null && venda.valor_a_receber > 0 && (
                    <div>
                      <p className="text-muted-foreground">A Receber</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_a_receber)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos da Venda - Tabela */}
      {portasEnrolarEPinturas.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Produtos da Venda - Portas Enrolar e Pinturas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 text-xs">#</TableHead>
                    <TableHead className="h-9 text-xs">Descrição</TableHead>
                    <TableHead className="h-9 text-xs">Tamanho</TableHead>
                    <TableHead className="h-9 text-xs">Cor</TableHead>
                    <TableHead className="h-9 text-xs text-right">Peso (kg)</TableHead>
                    <TableHead className="h-9 text-xs text-right">Meia Canas</TableHead>
                    <TableHead className="h-9 text-xs text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portasEnrolarEPinturas.map((produto: any, idx: number) => {
                    const peso = calcularPeso(produto);
                    const meiaCanas = calcularMeiaCanas(produto);
                    const tamanhoDisplay = produto.tamanho || 
                      (produto.largura && produto.altura 
                        ? `${produto.largura} x ${produto.altura}` 
                        : '—');

                    return (
                      <TableRow key={produto.id}>
                        <TableCell className="py-2 text-xs font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {produto.tipo_produto === 'pintura_epoxi' && (
                            <Badge variant="outline" className="mr-1.5 text-[10px] px-1">
                              PINTURA
                            </Badge>
                          )}
                          {produto.nome_produto || produto.descricao_produto || produto.descricao || 'Sem nome'}
                        </TableCell>
                        <TableCell className="py-2 text-xs font-mono">
                          {tamanhoDisplay}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {produto.cor?.nome ? (
                            <div className="flex items-center gap-1.5">
                              {produto.cor.codigo_hex && (
                                <div 
                                  className="w-3 h-3 rounded-sm border border-border shrink-0"
                                  style={{ backgroundColor: produto.cor.codigo_hex }}
                                />
                              )}
                              <span className="truncate">{produto.cor.nome}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-right font-medium">
                          {peso ? `${peso}` : '—'}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-right font-medium">
                          {meiaCanas ? `${meiaCanas}` : '—'}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-right font-semibold">
                          {produto.quantidade || 1}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linhas Categorizadas */}
      <LinhasCategorizadas
        linhas={linhas}
        isReadOnly={isReadOnly}
        onAdicionarLinha={adicionarLinha}
        onRemoverLinha={removerLinha}
      />

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/pedidos')}
          size="sm"
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
