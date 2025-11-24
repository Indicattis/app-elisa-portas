import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, Package, FileText, CheckCircle2, Clock, AlertCircle, XCircle, Edit, RefreshCw, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PedidoFluxogramaMap } from "@/components/pedidos/PedidoFluxogramaMap";
import { PedidoHistoricoMovimentacoes } from "@/components/pedidos/PedidoHistoricoMovimentacoes";
import { usePedidoLinhas, type PedidoLinhaUpdate } from "@/hooks/usePedidoLinhas";
import { useValidacaoLinhasPorPorta } from "@/hooks/useValidacaoLinhasPorPorta";
import { usePedidoPortaObservacoes } from "@/hooks/usePedidoPortaObservacoes";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { LinhasAgrupadasPorPorta } from "@/components/pedidos/LinhasAgrupadasPorPorta";
import { ObservacoesPortaForm } from "@/components/pedidos/ObservacoesPortaForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface PedidoLinha {
  id: string;
  descricao_produto: string;
  quantidade: number;
  observacoes?: string;
}

interface Ordem {
  id: string;
  tipo: string;
  numero_ordem: string;
  status: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  etapa_atual: string;
  status?: string;
  created_at: string;
  venda_id?: string;
  linhas: PedidoLinha[];
  ordens: Ordem[];
  venda?: {
    id: string;
    cliente_nome: string;
    cidade?: string;
    estado?: string;
    valor_venda?: number;
    forma_pagamento?: string;
    tipo_entrega?: string;
    data_prevista_entrega?: string;
    produtos?: any[];
  };
}

// Funções auxiliares para cálculos
const calcularPeso = (produto: any) => {
  if (produto.largura && produto.altura) {
    return (((produto.largura * produto.altura * 12) * 2) * 0.3).toFixed(1);
  }
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
  if (produto.tamanho) {
    const match = produto.tamanho.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
    if (match) {
      const altura = parseFloat(match[2]);
      return (altura / 0.076).toFixed(2);
    }
  }
  return null;
};

export default function PedidoView() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [linhasEditadas, setLinhasEditadas] = useState<Map<string, PedidoLinhaUpdate>>(new Map());
  const [salvando, setSalvando] = useState(false);
  const [mostrarModalAvancar, setMostrarModalAvancar] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Hooks para edição (apenas se pedido estiver aberto)
  const { linhas, adicionarLinha, removerLinha, atualizarLinhasEmLote } = usePedidoLinhas(id || "");
  const { moverParaProximaEtapa } = usePedidosEtapas();
  const { salvarObservacao, getObservacoesPorPorta } = usePedidoPortaObservacoes(id || "");

  // Buscar usuários ativos para select de observações
  const { data: usuarios = [] } = useQuery({
    queryKey: ['admin-users-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Filtrar portas do tipo "porta_enrolar"
  const portasEnrolar = pedido?.venda?.produtos?.filter(
    (p: any) => p.tipo_produto === 'porta_enrolar'
  ) || [];

  // Validação de linhas por porta
  const validacao = useValidacaoLinhasPorPorta(portasEnrolar, linhas);

  useEffect(() => {
    if (id) fetchPedidoDetails();
  }, [id]);

  const fetchPedidoDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Buscar pedido principal
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos_producao")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (pedidoError) throw pedidoError;
      if (!pedidoData) {
        toast({ variant: "destructive", title: "Erro", description: "Pedido não encontrado" });
        setLoading(false);
        return;
      }

      // Buscar venda relacionada separadamente com produtos
      let vendaData = null;
      let produtosVenda = [];
      if (pedidoData.venda_id) {
        const { data } = await supabase
          .from("vendas")
          .select(`
            id, 
            cliente_nome, 
            cidade, 
            estado,
            valor_venda,
            forma_pagamento,
            tipo_entrega,
            data_prevista_entrega,
            atendente_id
          `)
          .eq("id", pedidoData.venda_id)
          .maybeSingle();
        vendaData = data;

        // Buscar produtos da venda
        if (data) {
          const { data: produtos } = await supabase
            .from("produtos_vendas")
            .select("*")
            .eq("venda_id", data.id)
            .order("created_at");
          produtosVenda = produtos || [];
        }
      }


      // Buscar linhas do pedido
      const { data: linhasData } = await supabase
        .from("pedido_linhas")
        .select("*")
        .eq("pedido_id", id)
        .order("created_at");

      // Buscar ordens de produção
      const ordens: Ordem[] = [];
      
      const { data: ordensPerfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select("id, numero_ordem, status")
        .eq("pedido_id", id);
      
      const { data: ordensSeparacao } = await supabase
        .from("ordens_separacao")
        .select("id, numero_ordem, status")
        .eq("pedido_id", id);
      
      const { data: ordensSoldagem } = await supabase
        .from("ordens_soldagem")
        .select("id, numero_ordem, status")
        .eq("pedido_id", id);
      
      const { data: ordensPintura } = await supabase
        .from("ordens_pintura")
        .select("id, numero_ordem, status")
        .eq("pedido_id", id);
      
      const { data: ordensInstalacao } = await supabase
        .from("ordens_instalacao")
        .select("id")
        .eq("pedido_id", id);

      if (ordensPerfiladeira) {
        ordensPerfiladeira.forEach(o => ordens.push({ ...o, tipo: "Perfiladeira" }));
      }
      if (ordensSeparacao) {
        ordensSeparacao.forEach(o => ordens.push({ ...o, tipo: "Separação" }));
      }
      if (ordensSoldagem) {
        ordensSoldagem.forEach(o => ordens.push({ ...o, tipo: "Soldagem" }));
      }
      if (ordensPintura) {
        ordensPintura.forEach(o => ordens.push({ ...o, tipo: "Pintura" }));
      }
      if (ordensInstalacao) {
        ordensInstalacao.forEach(o => ordens.push({ ...o, tipo: "Instalação", numero_ordem: "N/A", status: "N/A" }));
      }

      setPedido({
        ...pedidoData as any,
        linhas: linhasData || [],
        ordens,
        venda: vendaData ? { ...vendaData, produtos: produtosVenda } : undefined,
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar pedido" });
    } finally {
      setLoading(false);
    }
  };

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
      setMostrarModalAvancar(true);
      fetchPedidoDetails();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSalvando(false);
    }
  };

  const handleAvancarEtapa = async () => {
    if (!pedido) return;
    
    try {
      await moverParaProximaEtapa.mutateAsync({
        pedidoId: pedido.id,
        skipCheckboxValidation: pedido.etapa_atual === 'aberto',
      });
      setMostrarModalAvancar(false);
      navigate('/dashboard/fabrica/pedidos');
    } catch (error) {
      console.error("Erro ao avançar etapa:", error);
      setMostrarModalAvancar(false);
    }
  };

  const getEtapaLabel = (etapa: string) => {
    const etapas: Record<string, string> = {
      aberto: "Aberto",
      em_producao: "Em Produção",
      inspecao_qualidade: "Inspeção de Qualidade",
      aguardando_pintura: "Aguardando Pintura",
      aguardando_coleta: "Expedição Coleta",
      aguardando_instalacao: "Expedição Instalação",
      finalizado: "Finalizado",
    };
    return etapas[etapa] || etapa;
  };

  const getEtapaBadgeColor = (etapa: string) => {
    const colors: Record<string, string> = {
      aberto: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      em_producao: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      inspecao_qualidade: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      aguardando_pintura: "bg-orange-500/10 text-orange-700 border-orange-500/20",
      aguardando_coleta: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
      aguardando_instalacao: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
      finalizado: "bg-green-500/10 text-green-700 border-green-500/20",
    };
    return colors[etapa] || "";
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      concluido: "bg-green-500/10 text-green-700 border-green-500/20",
      cancelado: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[status] || "";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "em_andamento":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "cancelado":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!pedido) return <div className="text-center py-8"><p>Pedido não encontrado</p></div>;

  const isAberto = pedido.etapa_atual === 'aberto';
  const temPendentesSalvamento = linhasEditadas.size > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{pedido.numero_pedido}</h1>
            <p className="text-sm text-muted-foreground">
              Cadastrado em {format(new Date(pedido.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPedidoDetails()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {isAberto && (
            <Button
              variant={modoEdicao ? "default" : "outline"}
              size="sm"
              onClick={() => setModoEdicao(!modoEdicao)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {modoEdicao ? "Modo Edição Ativo" : "Ativar Edição"}
            </Button>
          )}
        </div>
      </div>

      {/* Status e Etapa do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                pedido.etapa_atual === 'finalizado' ? 'bg-green-500' :
                pedido.etapa_atual === 'em_producao' ? 'bg-blue-500' :
                pedido.etapa_atual === 'aberto' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <div>
                <p className="text-sm text-muted-foreground">Etapa Atual</p>
                <p className="font-semibold text-lg">{getEtapaLabel(pedido.etapa_atual)}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${getEtapaBadgeColor(pedido.etapa_atual)} text-base px-4 py-2`}>
              {getEtapaLabel(pedido.etapa_atual)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Informações Compactas da Venda e Pedido */}
      {pedido.venda && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informações do Cliente e Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{pedido.venda.cliente_nome}</p>
              </div>
              {pedido.venda.cidade && pedido.venda.estado && (
                <div>
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{pedido.venda.cidade}, {pedido.venda.estado}</span>
                  </div>
                </div>
              )}
              {pedido.venda.valor_venda && (
                <div>
                  <p className="text-sm text-muted-foreground">Valor da Venda</p>
                  <p className="font-medium">R$ {Number(pedido.venda.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {pedido.venda.forma_pagamento && (
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{pedido.venda.forma_pagamento}</p>
                </div>
              )}
              {pedido.venda.tipo_entrega && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
                  <p className="font-medium capitalize">{pedido.venda.tipo_entrega}</p>
                </div>
              )}
              {pedido.venda.data_prevista_entrega && (
                <div>
                  <p className="text-sm text-muted-foreground">Data Prevista de Entrega</p>
                  <p className="font-medium">{format(new Date(pedido.venda.data_prevista_entrega), "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Produtos da Venda */}
      {pedido.venda?.produtos && pedido.venda.produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos da Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Tipo</th>
                    <th className="text-left p-2 text-sm font-medium">Descrição</th>
                    <th className="text-left p-2 text-sm font-medium">Tamanho</th>
                    <th className="text-left p-2 text-sm font-medium">Cor</th>
                    <th className="text-right p-2 text-sm font-medium">Peso (kg)</th>
                    <th className="text-right p-2 text-sm font-medium">Meia-canas</th>
                    <th className="text-center p-2 text-sm font-medium">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.venda.produtos.map((produto: any) => {
                    const peso = calcularPeso(produto);
                    const meiaCanas = calcularMeiaCanas(produto);
                    return (
                      <tr key={produto.id} className="border-b">
                        <td className="p-2 text-sm">{produto.tipo_produto || '-'}</td>
                        <td className="p-2 text-sm">{produto.descricao || '-'}</td>
                        <td className="p-2 text-sm">{produto.tamanho || '-'}</td>
                        <td className="p-2 text-sm">{produto.cor || '-'}</td>
                        <td className="p-2 text-sm text-right">{peso || '-'}</td>
                        <td className="p-2 text-sm text-right">{meiaCanas || '-'}</td>
                        <td className="p-2 text-sm text-center">
                          <Badge variant="outline">{produto.quantidade}x</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Preparação do Pedido (somente quando aberto e em modo edição) */}
      {isAberto && modoEdicao && portasEnrolar.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Preparação do Pedido
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={validacao.todasCompletas ? "default" : "secondary"}>
                  {validacao.portasCompletas} de {validacao.totalPortas} portas completas
                </Badge>
                {temPendentesSalvamento && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/50">
                    Alterações pendentes
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Separação */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Separação</h3>
                <Badge variant="outline">
                  {validacao.statusPorPorta.filter(s => s.separacao).length} de {portasEnrolar.length}
                </Badge>
              </div>
              <LinhasAgrupadasPorPorta
                categoria="separacao"
                portas={portasEnrolar}
                linhas={linhas}
                isReadOnly={false}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </div>

            <Separator />

            {/* Solda */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Solda</h3>
                <Badge variant="outline">
                  {validacao.statusPorPorta.filter(s => s.solda).length} de {portasEnrolar.length}
                </Badge>
              </div>
              <LinhasAgrupadasPorPorta
                categoria="solda"
                portas={portasEnrolar}
                linhas={linhas}
                isReadOnly={false}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </div>

            <Separator />

            {/* Perfiladeira */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Perfiladeira</h3>
                <Badge variant="outline">
                  {validacao.statusPorPorta.filter(s => s.perfiladeira).length} de {portasEnrolar.length}
                </Badge>
              </div>
              <LinhasAgrupadasPorPorta
                categoria="perfiladeira"
                portas={portasEnrolar}
                linhas={linhas}
                isReadOnly={false}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
                onChange={setLinhasEditadas}
                linhasEditadas={linhasEditadas}
              />
            </div>

            <Separator />

            {/* Observações */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Observações das Portas</h3>
              <div className="space-y-4">
                {portasEnrolar.map((porta: any, index: number) => (
                  <ObservacoesPortaForm
                    key={porta.id}
                    porta={porta}
                    portaIndex={index}
                    usuarios={usuarios}
                    valoresIniciais={getObservacoesPorPorta(porta.id)}
                    onSalvar={salvarObservacao}
                    pedidoId={pedido.id}
                  />
                ))}
              </div>
            </div>

            {/* Botão de Salvar (sticky) */}
            <div className="sticky bottom-0 bg-background pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {temPendentesSalvamento ? (
                    <span className="text-amber-600 font-medium">
                      {linhasEditadas.size} alteraç{linhasEditadas.size === 1 ? 'ão' : 'ões'} pendente{linhasEditadas.size === 1 ? '' : 's'}
                    </span>
                  ) : (
                    'Nenhuma alteração pendente'
                  )}
                </p>
                <Button
                  onClick={handleSalvarAlteracoes}
                  disabled={!temPendentesSalvamento || salvando}
                  size="lg"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fluxograma do Pedido */}
      <PedidoFluxogramaMap pedidoSelecionado={pedido} onClose={() => {}} />

      {/* Histórico de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PedidoHistoricoMovimentacoes pedidoId={pedido.id} />
        </CardContent>
      </Card>

      {/* Linhas do Pedido - Visualização */}
      {pedido.linhas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Itens do Pedido Cadastrados ({pedido.linhas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pedido.linhas.map((linha) => (
                <div key={linha.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{linha.descricao_produto}</p>
                    {linha.observacoes && (
                        <p className="text-sm text-muted-foreground mt-1">Obs: {linha.observacoes}</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {linha.quantidade}x
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ordens de Produção */}
      {pedido.ordens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ordens de Produção ({pedido.ordens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {pedido.ordens.map((ordem) => (
                <div key={ordem.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ordem.status !== "N/A" && getStatusIcon(ordem.status)}
                      <p className="font-semibold text-base">{ordem.tipo}</p>
                    </div>
                    {ordem.status !== "N/A" && (
                      <Badge variant="outline" className={`${getStatusBadgeColor(ordem.status)} font-medium`}>
                        {ordem.status === "aberto" && "Aberto"}
                        {ordem.status === "em_andamento" && "Em Andamento"}
                        {ordem.status === "concluido" && "Concluído"}
                        {ordem.status === "cancelado" && "Cancelado"}
                      </Badge>
                    )}
                  </div>
                  {ordem.numero_ordem !== "N/A" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>Ordem #{ordem.numero_ordem}</span>
                    </div>
                  )}
                  {ordem.status === "N/A" && (
                    <p className="text-sm text-muted-foreground">Ordem de instalação</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Ações Rápidas */}
      {pedido.venda_id && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate(`/dashboard/vendas/${pedido.venda_id}/view`)}>
              Ver Venda Relacionada
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação para Avançar Etapa */}
      <Dialog open={mostrarModalAvancar} onOpenChange={setMostrarModalAvancar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações Salvas!</DialogTitle>
            <DialogDescription>
              As alterações foram salvas com sucesso. Deseja avançar o pedido para a etapa de produção?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarModalAvancar(false);
                setModoEdicao(false);
              }}
            >
              Não, continuar editando
            </Button>
            <Button onClick={handleAvancarEtapa}>
              Sim, avançar para produção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
