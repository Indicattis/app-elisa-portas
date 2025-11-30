import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, Package, FileText, CheckCircle2, Clock, AlertCircle, XCircle, Edit, RefreshCw, Save, Hammer, Paintbrush, Truck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PedidoFluxogramaMap } from "@/components/pedidos/PedidoFluxogramaMap";
import { PedidoHistoricoMovimentacoes } from "@/components/pedidos/PedidoHistoricoMovimentacoes";
import { PedidoLinhasEditor } from "@/components/pedidos/PedidoLinhasEditor";
import { usePedidoLinhas, type PedidoLinhaUpdate, type PedidoLinha } from "@/hooks/usePedidoLinhas";
import { useValidacaoLinhasPorPorta } from "@/hooks/useValidacaoLinhasPorPorta";
import { usePedidoPortaObservacoes } from "@/hooks/usePedidoPortaObservacoes";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { LinhasAgrupadasPorPorta } from "@/components/pedidos/LinhasAgrupadasPorPorta";
import { ObservacoesPortaForm } from "@/components/pedidos/ObservacoesPortaForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface Ordem {
  id: string;
  tipo: string;
  numero_ordem: string;
  status: string;
  capturado_por?: {
    nome: string;
    foto_perfil_url?: string;
  } | null;
  concluido_por?: {
    nome: string;
    foto_perfil_url?: string;
  } | null;
  capturada_em?: string | null;
  data_conclusao?: string | null;
  tempo_conclusao_segundos?: number | null;
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
  const { linhas, adicionarLinha, removerLinha, atualizarCheckbox, atualizarLinhasEmLote } = usePedidoLinhas(id || "");
  const { moverParaProximaEtapa } = usePedidosEtapas();
  const { salvarObservacao, getObservacoesPorPorta } = usePedidoPortaObservacoes(id || "");

  // Sincronizar linhas do hook com o estado local do pedido
  useEffect(() => {
    if (pedido && linhas) {
      setPedido(prev => prev ? { ...prev, linhas } : null);
    }
  }, [linhas]);

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

  // Verificar se todas as ordens foram concluídas
  const todasOrdensConcluidas = pedido?.ordens && pedido.ordens.length > 0 && pedido.ordens.every((o) => o.status === "concluido");

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

      // Buscar ordens de produção com dados dos usuários
      const ordens: Ordem[] = [];
      
      const { data: ordensPerfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select(`
          id, 
          numero_ordem, 
          status,
          created_by,
          responsavel_id,
          capturada_em,
          data_conclusao,
          tempo_conclusao_segundos,
          capturado_por:admin_users!ordens_perfiladeira_created_by_fkey(nome, foto_perfil_url),
          concluido_por:admin_users!ordens_perfiladeira_responsavel_id_fkey(nome, foto_perfil_url)
        `)
        .eq("pedido_id", id);
      
      const { data: ordensSeparacao } = await supabase
        .from("ordens_separacao")
        .select(`
          id, 
          numero_ordem, 
          status,
          created_by,
          responsavel_id,
          capturada_em,
          data_conclusao,
          tempo_conclusao_segundos,
          capturado_por:admin_users!ordens_separacao_created_by_fkey(nome, foto_perfil_url),
          concluido_por:admin_users!ordens_separacao_responsavel_id_fkey(nome, foto_perfil_url)
        `)
        .eq("pedido_id", id);
      
      const { data: ordensSoldagem } = await supabase
        .from("ordens_soldagem")
        .select(`
          id, 
          numero_ordem, 
          status,
          created_by,
          responsavel_id,
          capturada_em,
          data_conclusao,
          tempo_conclusao_segundos,
          capturado_por:admin_users!ordens_soldagem_created_by_fkey(nome, foto_perfil_url),
          concluido_por:admin_users!ordens_soldagem_responsavel_id_fkey(nome, foto_perfil_url)
        `)
        .eq("pedido_id", id);
      
      const { data: ordensPintura } = await supabase
        .from("ordens_pintura")
        .select(`
          id, 
          numero_ordem, 
          status,
          created_by,
          responsavel_id,
          capturada_em,
          data_conclusao,
          tempo_conclusao_segundos,
          capturado_por:admin_users!ordens_pintura_created_by_fkey(nome, foto_perfil_url),
          concluido_por:admin_users!ordens_pintura_responsavel_id_fkey(nome, foto_perfil_url)
        `)
        .eq("pedido_id", id);
      
      const { data: ordensQualidade } = await supabase
        .from("ordens_qualidade")
        .select(`
          id, 
          numero_ordem, 
          status,
          created_by,
          responsavel_id,
          capturada_em,
          data_conclusao,
          tempo_conclusao_segundos,
          capturado_por:admin_users!ordens_qualidade_created_by_fkey(nome, foto_perfil_url),
          concluido_por:admin_users!ordens_qualidade_responsavel_id_fkey(nome, foto_perfil_url)
        `)
        .eq("pedido_id", id);
      
      const { data: ordensInstalacao } = await supabase
        .from("ordens_instalacao")
        .select("id")
        .eq("pedido_id", id);

      if (ordensPerfiladeira) {
        ordensPerfiladeira.forEach((o: any) => ordens.push({ 
          id: o.id,
          numero_ordem: o.numero_ordem,
          status: o.status,
          tipo: "Perfiladeira",
          capturado_por: o.capturado_por,
          concluido_por: o.concluido_por,
          capturada_em: o.capturada_em,
          data_conclusao: o.data_conclusao,
          tempo_conclusao_segundos: o.tempo_conclusao_segundos
        }));
      }
      if (ordensSeparacao) {
        ordensSeparacao.forEach((o: any) => ordens.push({ 
          id: o.id,
          numero_ordem: o.numero_ordem,
          status: o.status,
          tipo: "Separação",
          capturado_por: o.capturado_por,
          concluido_por: o.concluido_por,
          capturada_em: o.capturada_em,
          data_conclusao: o.data_conclusao,
          tempo_conclusao_segundos: o.tempo_conclusao_segundos
        }));
      }
      if (ordensSoldagem) {
        ordensSoldagem.forEach((o: any) => ordens.push({ 
          id: o.id,
          numero_ordem: o.numero_ordem,
          status: o.status,
          tipo: "Soldagem",
          capturado_por: o.capturado_por,
          concluido_por: o.concluido_por,
          capturada_em: o.capturada_em,
          data_conclusao: o.data_conclusao,
          tempo_conclusao_segundos: o.tempo_conclusao_segundos
        }));
      }
      if (ordensPintura) {
        ordensPintura.forEach((o: any) => ordens.push({ 
          id: o.id,
          numero_ordem: o.numero_ordem,
          status: o.status,
          tipo: "Pintura",
          capturado_por: o.capturado_por,
          concluido_por: o.concluido_por,
          capturada_em: o.capturada_em,
          data_conclusao: o.data_conclusao,
          tempo_conclusao_segundos: o.tempo_conclusao_segundos
        }));
      }
      if (ordensQualidade) {
        ordensQualidade.forEach((o: any) => ordens.push({ 
          id: o.id,
          numero_ordem: o.numero_ordem,
          status: o.status,
          tipo: "Qualidade",
          capturado_por: o.capturado_por,
          concluido_por: o.concluido_por,
          capturada_em: o.capturada_em,
          data_conclusao: o.data_conclusao,
          tempo_conclusao_segundos: o.tempo_conclusao_segundos
        }));
      }
      if (ordensInstalacao) {
        ordensInstalacao.forEach((o: any) => ordens.push({ 
          id: o.id,
          tipo: "Instalação", 
          numero_ordem: "N/A", 
          status: "N/A",
          capturado_por: null,
          concluido_por: null,
          capturada_em: null,
          data_conclusao: null,
          tempo_conclusao_segundos: null
        }));
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
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">Pedido #{pedido.numero_pedido}</h1>
            <p className="text-xs text-muted-foreground">
              Cadastrado em {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPedidoDetails()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className={`${getEtapaBadgeColor(pedido.etapa_atual)} text-xs px-2 py-0.5`}>
            {getEtapaLabel(pedido.etapa_atual)}
          </Badge>
        </div>
      </div>

      {/* Grid: Informações do Cliente e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Informações do Cliente */}
        {pedido.venda && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{pedido.venda.cliente_nome}</p>
                </div>
                {pedido.venda.cidade && pedido.venda.estado && (
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{pedido.venda.cidade}, {pedido.venda.estado}</span>
                    </div>
                  </div>
                )}
                {pedido.venda.valor_venda && (
                  <div>
                    <p className="text-xs text-muted-foreground">Valor da Venda</p>
                    <p className="font-medium">R$ {Number(pedido.venda.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                {pedido.venda.forma_pagamento && (
                  <div>
                    <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium capitalize">{pedido.venda.forma_pagamento}</p>
                  </div>
                )}
                {pedido.venda.tipo_entrega && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Entrega</p>
                    <p className="font-medium capitalize">{pedido.venda.tipo_entrega}</p>
                  </div>
                )}
                {pedido.venda.data_prevista_entrega && (
                  <div>
                    <p className="text-xs text-muted-foreground">Data Prevista</p>
                    <p className="font-medium">{format(new Date(pedido.venda.data_prevista_entrega), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Ações Rápidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pedido.venda_id && (
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm h-9" 
                onClick={() => navigate(`/dashboard/vendas/${pedido.venda_id}/view`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Venda
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos da Venda */}
      {pedido.venda?.produtos && pedido.venda.produtos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos da Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs">
                    <th className="text-left p-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Tamanho</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Cor</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Peso (kg)</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">M. Canas</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.venda.produtos.map((produto: any) => {
                    const peso = calcularPeso(produto);
                    const meiaCanas = calcularMeiaCanas(produto);
                    return (
                      <tr key={produto.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-xs">{produto.tipo_produto || '-'}</td>
                        <td className="p-2 text-xs">{produto.descricao || '-'}</td>
                        <td className="p-2 text-xs">{produto.tamanho || '-'}</td>
                        <td className="p-2 text-xs">{produto.cor || '-'}</td>
                        <td className="p-2 text-xs text-right">{peso || '-'}</td>
                        <td className="p-2 text-xs text-right">{meiaCanas || '-'}</td>
                        <td className="p-2 text-center">
                          <Badge variant="secondary" className="text-xs">{produto.quantidade}x</Badge>
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

      {/* Seção de Preparação do Pedido - REMOVIDA, edição agora é inline na tabela */}

      {/* Itens do Pedido */}
      {isAberto && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Itens do Pedido {pedido.linhas.length > 0 && `(${pedido.linhas.length})`}
              </CardTitle>
              {isAberto && (
                <div className="flex items-center gap-2">
                  {!modoEdicao ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModoEdicao(true)}
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setModoEdicao(false);
                          setLinhasEditadas(new Map());
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSalvarAlteracoes}
                        disabled={!temPendentesSalvamento || salvando}
                      >
                        {salvando ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <PedidoLinhasEditor
              linhas={pedido.linhas}
              isReadOnly={!modoEdicao}
              todasOrdensConcluidas={todasOrdensConcluidas}
              vendaId={pedido.venda_id}
              temPortasEnrolar={portasEnrolar.length > 0}
              onAdicionarLinha={adicionarLinha}
              onRemoverLinha={removerLinha}
              onAtualizarCheckbox={async (linhaId: string, campo: string, valor: boolean) => {
                await atualizarCheckbox({ linhaId, campo, valor });
              }}
              onAtualizarLinha={(linhaId: string, campo: 'quantidade' | 'tamanho', valor: number | string) => {
                setLinhasEditadas(prev => {
                  const novoMapa = new Map(prev);
                  const linhaExistente = novoMapa.get(linhaId) || { id: linhaId };
                  novoMapa.set(linhaId, {
                    ...linhaExistente,
                    [campo]: valor,
                  });
                  return novoMapa;
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Histórico de Movimentações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PedidoHistoricoMovimentacoes pedidoId={pedido.id} />
        </CardContent>
      </Card>

      {/* Fluxograma */}
      <PedidoFluxogramaMap pedidoSelecionado={pedido} onClose={() => {}} />

      {/* Ordens de Produção */}
      {pedido.ordens.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Ordens de Produção ({pedido.ordens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs">
                    <th className="text-left p-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Número</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Capturado por</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Concluído por</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Data Conclusão</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Tempo Produção</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.ordens.map((ordem) => (
                    <tr key={ordem.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {ordem.tipo === 'Perfiladeira' && <Hammer className="w-3 h-3 text-muted-foreground" />}
                          {ordem.tipo === 'Separação' && <Package className="w-3 h-3 text-muted-foreground" />}
                          {ordem.tipo === 'Soldagem' && <Hammer className="w-3 h-3 text-muted-foreground" />}
                          {ordem.tipo === 'Pintura' && <Paintbrush className="w-3 h-3 text-muted-foreground" />}
                          {ordem.tipo === 'Qualidade' && <CheckCircle2 className="w-3 h-3 text-muted-foreground" />}
                          {ordem.tipo === 'Instalação' && <Truck className="w-3 h-3 text-muted-foreground" />}
                          <span className="text-sm font-medium">{ordem.tipo}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {ordem.numero_ordem !== "N/A" ? `#${ordem.numero_ordem}` : '-'}
                      </td>
                      <td className="p-2">
                        {ordem.status !== "N/A" ? (
                          <Badge variant="outline" className={`${getStatusBadgeColor(ordem.status)} text-xs`}>
                            {ordem.status === "aberto" && "Aberto"}
                            {ordem.status === "em_andamento" && "Em Andamento"}
                            {ordem.status === "concluido" && "Concluído"}
                            {ordem.status === "cancelado" && "Cancelado"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {ordem.capturado_por ? (
                          <div className="flex items-center gap-2">
                            {ordem.capturado_por.foto_perfil_url ? (
                              <img 
                                src={ordem.capturado_por.foto_perfil_url} 
                                alt={ordem.capturado_por.nome}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs">{ordem.capturado_por.nome}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {ordem.concluido_por ? (
                          <div className="flex items-center gap-2">
                            {ordem.concluido_por.foto_perfil_url ? (
                              <img 
                                src={ordem.concluido_por.foto_perfil_url} 
                                alt={ordem.concluido_por.nome}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs">{ordem.concluido_por.nome}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {ordem.data_conclusao ? (
                          <span className="text-xs">
                            {format(new Date(ordem.data_conclusao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {ordem.tempo_conclusao_segundos ? (
                          <span className="text-xs font-medium">
                            {Math.floor(ordem.tempo_conclusao_segundos / 3600)}h {Math.floor((ordem.tempo_conclusao_segundos % 3600) / 60)}min
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
