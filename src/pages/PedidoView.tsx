import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, Package, FileText, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PedidoFluxogramaMap } from "@/components/pedidos/PedidoFluxogramaMap";
import { PedidoHistoricoMovimentacoes } from "@/components/pedidos/PedidoHistoricoMovimentacoes";

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

export default function PedidoView() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      {/* Informações da Venda */}
      {pedido.venda && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informações da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/vendas/${pedido.venda_id}/view`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Venda Completa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Produtos da Venda */}
      {pedido.venda?.produtos && pedido.venda.produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos da Venda ({pedido.venda.produtos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pedido.venda.produtos.map((produto: any) => (
                <div key={produto.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{produto.descricao || 'Produto'}</p>
                      {produto.tipo_produto && (
                        <p className="text-sm text-muted-foreground mt-1">Tipo: {produto.tipo_produto}</p>
                      )}
                      {produto.tamanho && (
                        <p className="text-sm text-muted-foreground">Tamanho: {produto.tamanho}</p>
                      )}
                      {produto.cor && (
                        <p className="text-sm text-muted-foreground">Cor: {produto.cor}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {produto.quantidade}x
                      </Badge>
                      {produto.valor_total && (
                        <p className="text-sm font-medium">
                          R$ {Number(produto.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linhas do Pedido */}
      {pedido.linhas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Itens do Pedido ({pedido.linhas.length})
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
    </div>
  );
}
