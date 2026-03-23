import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Phone, MapPin, Hash, Package, CreditCard, Save, FileText, RefreshCw } from "lucide-react";
import { usePedidoLinhas, type PedidoLinhaUpdate } from "@/hooks/usePedidoLinhas";
import { LinhasAgrupadasPorPorta } from "@/components/pedidos/LinhasAgrupadasPorPorta";
import { useValidacaoLinhasPorPorta } from "@/hooks/useValidacaoLinhasPorPorta";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Flame, Settings } from "lucide-react";
import { ObservacoesPortaForm } from "@/components/pedidos/ObservacoesPortaForm";
import { usePedidoPortaObservacoes } from "@/hooks/usePedidoPortaObservacoes";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PedidoPreparacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [linhasEditadas, setLinhasEditadas] = useState<Map<string, PedidoLinhaUpdate>>(new Map());
  const [salvando, setSalvando] = useState(false);
  const [mostrarModalAvancar, setMostrarModalAvancar] = useState(false);
  
  const { moverParaProximaEtapa } = usePedidosEtapas();
  const queryClient = useQueryClient();

  const { data: pedido, isLoading: pedidoLoading, refetch: refetchPedido } = useQuery({
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
    atualizarLinhasEmLote,
  } = usePedidoLinhas(id || '');

  const {
    observacoes,
    isLoading: observacoesLoading,
    salvarObservacao,
    getObservacoesPorPorta,
  } = usePedidoPortaObservacoes(id || '');

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, email')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: autorizados = [] } = useQuery({
    queryKey: ['autorizados-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autorizados')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

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
  const portas = produtos.filter((p: any) => p.tipo_produto === 'porta_enrolar');

  // Validação por porta
  const {
    statusPorPorta,
    todasCompletas,
    portasCompletas,
    totalPortas,
    podeSalvar,
  } = useValidacaoLinhasPorPorta(portas, linhas);

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

  const isReadOnly = pedido.etapa_atual !== 'aberto' && pedido.etapa_atual !== 'aprovacao_ceo';
  const temAlteracoesPendentes = linhasEditadas.size > 0;

  const handleSalvarAlteracoes = async () => {
    if (linhasEditadas.size === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Não há alterações para salvar.",
      });
      return;
    }

    setSalvando(true);
    try {
      const updates = Array.from(linhasEditadas.values());
      await atualizarLinhasEmLote(updates);
      setLinhasEditadas(new Map());
      // Após salvar com sucesso, mostrar modal perguntando se quer avançar
      setMostrarModalAvancar(true);
    } finally {
      setSalvando(false);
    }
  };

  const handleAvancarEtapa = async () => {
    if (!id) return;
    
    try {
      // Pular validação de checkboxes quando está na etapa 'aberto'
      // pois o usuário está apenas preparando o pedido
      const skipValidation = pedido?.etapa_atual === 'aberto';
      await moverParaProximaEtapa.mutateAsync({ 
        pedidoId: id, 
        skipCheckboxValidation: skipValidation 
      });
      setMostrarModalAvancar(false);
      navigate('/dashboard/pedidos');
    } catch (error) {
      // Erro já é tratado no hook
      setMostrarModalAvancar(false);
    }
  };

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
          <Badge variant="secondary" className="text-xs">
            {pedido.etapa_atual}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              refetchPedido();
              queryClient.invalidateQueries({ queryKey: ['pedido-linhas'] });
            }}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {temAlteracoesPendentes && (
            <Badge variant="outline" className="text-xs">
              {linhasEditadas.size} alteraç{linhasEditadas.size === 1 ? 'ão' : 'ões'} pendente{linhasEditadas.size === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        {!isReadOnly && (
          <Button
            onClick={handleSalvarAlteracoes}
            disabled={!temAlteracoesPendentes || salvando}
            size="sm"
            className="gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            {salvando 
              ? "Salvando..." 
              : `Salvar${linhasEditadas.size > 0 ? ` (${linhasEditadas.size})` : ''}`
            }
          </Button>
        )}
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
      {produtos.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Produtos da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 text-xs">#</TableHead>
                    <TableHead className="h-9 text-xs">Tipo</TableHead>
                    <TableHead className="h-9 text-xs">Descrição</TableHead>
                    <TableHead className="h-9 text-xs">Tamanho</TableHead>
                    <TableHead className="h-9 text-xs">Cor</TableHead>
                    <TableHead className="h-9 text-xs text-right">Peso (kg)</TableHead>
                    <TableHead className="h-9 text-xs text-right">Meia Canas</TableHead>
                    <TableHead className="h-9 text-xs text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto: any, idx: number) => {
                    const peso = calcularPeso(produto);
                    const meiaCanas = calcularMeiaCanas(produto);
                    const tamanhoDisplay = produto.tamanho || 
                      (produto.largura && produto.altura 
                        ? `${Number(produto.largura).toFixed(2)}m x ${Number(produto.altura).toFixed(2)}m` 
                        : '—');

                    return (
                      <TableRow key={produto.id}>
                        <TableCell className="py-2 text-xs font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <Badge variant="outline" className="text-[10px] px-1.5 capitalize">
                            {produto.tipo_produto?.replace(/_/g, ' ') || 'Produto'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
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

      {/* Verificar se há portas */}
      {portas.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Este pedido não possui portas de enrolar. Adicione produtos à venda antes de preparar o pedido.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Separação */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <CardTitle className="text-sm font-semibold">Separação</CardTitle>
                </div>
                <Badge variant={statusPorPorta.every(s => s.separacao) ? "default" : "secondary"}>
                  {statusPorPorta.filter(s => s.separacao).length}/{totalPortas} portas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <LinhasAgrupadasPorPorta
                categoria="separacao"
                portas={portas}
                linhas={linhas}
                isReadOnly={isReadOnly}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </CardContent>
          </Card>

          {/* Solda */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <CardTitle className="text-sm font-semibold">Solda</CardTitle>
                </div>
                <Badge variant={statusPorPorta.every(s => s.solda) ? "default" : "secondary"}>
                  {statusPorPorta.filter(s => s.solda).length}/{totalPortas} portas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <LinhasAgrupadasPorPorta
                categoria="solda"
                portas={portas}
                linhas={linhas}
                isReadOnly={isReadOnly}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </CardContent>
          </Card>

          {/* Perfiladeira */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <CardTitle className="text-sm font-semibold">Perfiladeira</CardTitle>
                </div>
                <Badge variant={statusPorPorta.every(s => s.perfiladeira) ? "default" : "secondary"}>
                  {statusPorPorta.filter(s => s.perfiladeira).length}/{totalPortas} portas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <LinhasAgrupadasPorPorta
                categoria="perfiladeira"
                portas={portas}
                linhas={linhas}
                isReadOnly={isReadOnly}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold">Observações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-4">
                {portas.map((porta: any, idx: number) => (
                  <ObservacoesPortaForm
                    key={porta.id}
                    porta={porta}
                    portaIndex={idx}
                    usuarios={usuarios}
                    autorizados={autorizados}
                    valoresIniciais={getObservacoesPorPorta(porta.id)}
                    onSalvar={salvarObservacao}
                    pedidoId={id || ''}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/pedidos')}
          size="sm"
        >
          Voltar
        </Button>
        {!isReadOnly && portas.length > 0 && (
          <Button
            onClick={handleSalvarAlteracoes}
            disabled={!podeSalvar || !temAlteracoesPendentes || salvando}
            size="sm"
            className="gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            {!podeSalvar 
              ? `Faltam linhas (${portasCompletas}/${totalPortas} portas)`
              : salvando 
              ? "Salvando..." 
              : `Salvar${linhasEditadas.size > 0 ? ` (${linhasEditadas.size})` : ''}`
            }
          </Button>
        )}
      </div>

      {/* Modal para avançar etapa */}
      <Dialog open={mostrarModalAvancar} onOpenChange={setMostrarModalAvancar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar para Produção?</DialogTitle>
            <DialogDescription>
              A preparação foi salva com sucesso. Deseja avançar este pedido para a fase de produção?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarModalAvancar(false)}
            >
              Não, continuar editando
            </Button>
            <Button
              onClick={handleAvancarEtapa}
              disabled={moverParaProximaEtapa.isPending}
            >
              {moverParaProximaEtapa.isPending ? "Avançando..." : "Sim, avançar para produção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
