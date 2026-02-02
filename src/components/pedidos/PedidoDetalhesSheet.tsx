import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Package, Phone, MapPin, Calendar, DollarSign, ListChecks, 
  ShoppingCart, CheckCircle2, Clock, AlertCircle, XCircle,
  FolderOpen, ChevronDown, User, Wrench, Factory, History, ChevronRight, FileText
} from "lucide-react";
import { PedidoHistoricoMovimentacoes } from "./PedidoHistoricoMovimentacoes";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatarNumeroPedidoMensal } from "@/utils/pedidoFormatters";
import { PedidoFluxogramaMap } from "./PedidoFluxogramaMap";
import { OrdemLinhasSheet } from "@/components/fabrica/OrdemLinhasSheet";
import type { OrdemStatus, TipoOrdem, LinhaProblemaInfo, ResponsavelInfo } from "@/hooks/useOrdensPorPedido";
import {
  OPCOES_INTERNA_EXTERNA,
  OPCOES_LADO_MOTOR,
  OPCOES_POSICAO_GUIA,
  OPCOES_GUIA,
  OPCOES_APARENCIA_TESTEIRA,
} from "@/types/pedidoObservacoes";

interface ObservacaoVisita {
  id: string;
  produto_venda_id: string;
  indice_porta: number;
  interna_externa: string;
  lado_motor: string;
  posicao_guia: string;
  opcao_guia: string;
  aparencia_testeira: string;
  produto?: {
    largura?: number;
    altura?: number;
    tamanho?: string;
  } | null;
}

interface PedidoDetalhesSheetProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrdemProducao {
  id: string;
  numero_ordem: string | number;
  status: string;
  tipo: TipoOrdem;
  tipoLabel: string;
  responsavel_id: string | null;
  responsavel: ResponsavelInfo | null;
  pausada: boolean;
  justificativa_pausa: string | null;
  pausada_em: string | null;
  linha_problema: LinhaProblemaInfo | null;
}

export function PedidoDetalhesSheet({ pedido, open, onOpenChange }: PedidoDetalhesSheetProps) {
  const venda = pedido.vendas;
  const { linhas, isLoading } = usePedidoLinhas(pedido.id);
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(false);
  const [linhasOpen, setLinhasOpen] = useState(false);
  const [itensOpen, setItensOpen] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemStatus | null>(null);
  const [showOrdemLinhas, setShowOrdemLinhas] = useState(false);
  const [observacoesVisita, setObservacoesVisita] = useState<ObservacaoVisita[]>([]);
  
  useEffect(() => {
    if (open && pedido?.id) {
      fetchOrdens();
      fetchObservacoesVisita();
    }
  }, [open, pedido?.id]);

  const fetchObservacoesVisita = async () => {
    try {
      const { data, error } = await supabase
        .from('pedido_porta_observacoes')
        .select(`
          *,
          produto:produtos_vendas!produto_venda_id(largura, altura, tamanho)
        `)
        .eq('pedido_id', pedido.id)
        .order('indice_porta', { ascending: true });
      
      if (!error && data) {
        setObservacoesVisita(data as ObservacaoVisita[]);
      }
    } catch (error) {
      console.error("Erro ao buscar observações:", error);
    }
  };

  const getIniciais = (nome: string): string => {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const fetchOrdens = async () => {
    setLoadingOrdens(true);
    try {
      const ordensData: OrdemProducao[] = [];

      // Helper para buscar info do responsável
      const fetchResponsavel = async (responsavel_id: string | null): Promise<ResponsavelInfo | null> => {
        if (!responsavel_id) return null;
        const { data: user } = await supabase
          .from('admin_users')
          .select('foto_perfil_url, nome')
          .eq('user_id', responsavel_id)
          .maybeSingle();
        if (!user) return null;
        return { 
          foto_url: user.foto_perfil_url || null, 
          nome: user.nome,
          iniciais: getIniciais(user.nome)
        };
      };

      // Helper para processar linha problema
      const processLinhaProblema = (linha: any): LinhaProblemaInfo | null => {
        if (!linha) return null;
        return {
          id: linha.id,
          item: linha.item,
          quantidade: linha.quantidade,
          tamanho: linha.tamanho,
        };
      };

      // Buscar ordem de soldagem
      const { data: soldagem } = await supabase
        .from("ordens_soldagem")
        .select(`
          id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em,
          linha_problema:linha_problema_id (id, item, quantidade, tamanho)
        `)
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (soldagem) {
        const resp = await fetchResponsavel(soldagem.responsavel_id);
        ordensData.push({ 
          id: soldagem.id,
          numero_ordem: soldagem.numero_ordem,
          status: soldagem.status,
          tipo: "soldagem",
          tipoLabel: "Soldagem",
          responsavel_id: soldagem.responsavel_id,
          responsavel: resp,
          pausada: soldagem.pausada || false,
          justificativa_pausa: soldagem.justificativa_pausa,
          pausada_em: soldagem.pausada_em,
          linha_problema: processLinhaProblema(soldagem.linha_problema),
        });
      }

      // Buscar ordem de perfiladeira
      const { data: perfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select(`
          id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em,
          linha_problema:linha_problema_id (id, item, quantidade, tamanho)
        `)
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (perfiladeira) {
        const resp = await fetchResponsavel(perfiladeira.responsavel_id);
        ordensData.push({ 
          id: perfiladeira.id,
          numero_ordem: perfiladeira.numero_ordem,
          status: perfiladeira.status,
          tipo: "perfiladeira",
          tipoLabel: "Perfiladeira",
          responsavel_id: perfiladeira.responsavel_id,
          responsavel: resp,
          pausada: perfiladeira.pausada || false,
          justificativa_pausa: perfiladeira.justificativa_pausa,
          pausada_em: perfiladeira.pausada_em,
          linha_problema: processLinhaProblema(perfiladeira.linha_problema),
        });
      }

      // Buscar ordem de separação
      const { data: separacao } = await supabase
        .from("ordens_separacao")
        .select(`
          id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em,
          linha_problema:linha_problema_id (id, item, quantidade, tamanho)
        `)
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (separacao) {
        const resp = await fetchResponsavel(separacao.responsavel_id);
        ordensData.push({ 
          id: separacao.id,
          numero_ordem: separacao.numero_ordem,
          status: separacao.status,
          tipo: "separacao",
          tipoLabel: "Separação",
          responsavel_id: separacao.responsavel_id,
          responsavel: resp,
          pausada: separacao.pausada || false,
          justificativa_pausa: separacao.justificativa_pausa,
          pausada_em: separacao.pausada_em,
          linha_problema: processLinhaProblema(separacao.linha_problema),
        });
      }

      // Buscar ordem de qualidade
      const { data: qualidade } = await supabase
        .from("ordens_qualidade")
        .select("id, numero_ordem, status, responsavel_id")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (qualidade) {
        const resp = await fetchResponsavel(qualidade.responsavel_id);
        ordensData.push({ 
          id: qualidade.id,
          numero_ordem: qualidade.numero_ordem,
          status: qualidade.status,
          tipo: "qualidade",
          tipoLabel: "Qualidade",
          responsavel_id: qualidade.responsavel_id,
          responsavel: resp,
          pausada: false,
          justificativa_pausa: null,
          pausada_em: null,
          linha_problema: null,
        });
      }

      // Buscar ordem de pintura
      const { data: pintura } = await supabase
        .from("ordens_pintura")
        .select("id, numero_ordem, status, responsavel_id")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (pintura) {
        const resp = await fetchResponsavel(pintura.responsavel_id);
        ordensData.push({ 
          id: pintura.id,
          numero_ordem: pintura.numero_ordem,
          status: pintura.status,
          tipo: "pintura",
          tipoLabel: "Pintura",
          responsavel_id: pintura.responsavel_id,
          responsavel: resp,
          pausada: false,
          justificativa_pausa: null,
          pausada_em: null,
          linha_problema: null,
        });
      }

      setOrdens(ordensData);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
    } finally {
      setLoadingOrdens(false);
    }
  };

  const handleOrdemClick = (ordem: OrdemProducao) => {
    const ordemStatus: OrdemStatus = {
      existe: true,
      id: ordem.id,
      numero_ordem: String(ordem.numero_ordem),
      status: ordem.status,
      tipo: ordem.tipo,
      responsavel: ordem.responsavel,
      responsavel_id: ordem.responsavel_id,
      pausada: ordem.pausada,
      justificativa_pausa: ordem.justificativa_pausa,
      pausada_em: ordem.pausada_em,
      linha_problema: ordem.linha_problema,
      linhas_concluidas: 0,
      total_linhas: 0,
      capturada_em: null,
      tempo_acumulado_segundos: null,
      tempo_conclusao_segundos: null,
    };
    setOrdemSelecionada(ordemStatus);
    setShowOrdemLinhas(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
      case "pronta":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "em_andamento":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "cancelado":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: "Pendente",
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
      pronta: "Pronta",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      em_andamento: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      concluido: "bg-green-500/20 text-green-400 border-green-500/30",
      pronta: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[status] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  };

  const getOrdemIcon = (tipo: TipoOrdem | string) => {
    switch (tipo) {
      case "soldagem":
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case "perfiladeira":
        return <Factory className="w-4 h-4 text-purple-400" />;
      case "separacao":
        return <Package className="w-4 h-4 text-cyan-400" />;
      case "qualidade":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "pintura":
        return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-400" />;
      default:
        return <Package className="w-4 h-4 text-white/60" />;
    }
  };
  
  if (!venda) return null;

  const produtos = venda.produtos_vendas || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] max-w-[700px] mx-auto rounded-t-2xl overflow-hidden flex flex-col p-0 bg-zinc-900 border-t border-white/10"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                Pedido {formatarNumeroPedidoMensal(pedido.numero_mes, pedido.mes_vigencia, pedido.numero_pedido)}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {pedido.ficha_visita_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                    asChild
                  >
                    <a href={pedido.ficha_visita_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Anexo
                    </a>
                  </Button>
                )}
                {venda.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/dashboard/vendas/${venda.id}/view`);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ver Venda
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Hero Section - Cliente e Valor */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Info Cliente */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-2 truncate">
                  {venda.cliente_nome}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                  {(venda.cidade || venda.estado) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      {[venda.cidade, venda.estado].filter(Boolean).join(' - ')}
                    </span>
                  )}
                  {venda.cliente_telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-green-400" />
                      {venda.cliente_telefone}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Valor da Venda */}
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Valor Total</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(venda.valor_venda || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Fluxograma do Pedido */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">
              Fluxo do Pedido
            </h3>
            <PedidoFluxogramaMap pedidoSelecionado={pedido} variant="inline" />
          </div>

          {/* Seções Colapsáveis */}
          <div className="space-y-3">
            {/* Linhas do Pedido */}
            <Collapsible open={linhasOpen} onOpenChange={setLinhasOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-white text-sm">Linhas do Pedido</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {isLoading ? '...' : linhas.length}
                    </Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-white/60 transition-transform duration-200",
                    linhasOpen && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1.5 pl-2">
                {isLoading ? (
                  <div className="text-sm text-white/50 p-2">Carregando...</div>
                ) : linhas.length > 0 ? (
                  linhas.map((linha: any) => (
                    <div key={linha.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{linha.nome_produto}</p>
                        {linha.tamanho && (
                          <p className="text-white/40 text-[11px]">{linha.tamanho}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white/5 border-white/20 text-white/80">
                        {linha.quantidade}x
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/50 p-2">Nenhuma linha cadastrada</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Itens da Venda */}
            <Collapsible open={itensOpen} onOpenChange={setItensOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white text-sm">Itens da Venda</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      {produtos.length}
                    </Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-white/60 transition-transform duration-200",
                    itensOpen && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1.5 pl-2">
                {produtos.length > 0 ? (
                  produtos.map((produto: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/5">
                      <Package className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{produto.tipo_produto}</p>
                        {produto.cor?.nome && (
                          <p className="text-white/40 text-[11px]">Cor: {produto.cor.nome}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/50 p-2">Nenhum item na venda</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Observações da Visita Técnica */}
            {observacoesVisita.length > 0 && (
              <Collapsible open={observacoesOpen} onOpenChange={setObservacoesOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-amber-400" />
                      <span className="font-medium text-white text-sm">Especificações da Visita Técnica</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                        {observacoesVisita.length} {observacoesVisita.length === 1 ? 'porta' : 'portas'}
                      </Badge>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-amber-400 transition-transform duration-200",
                      observacoesOpen && "rotate-180"
                    )} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-2">
                  {observacoesVisita.map((obs, idx) => (
                    <div key={obs.id || idx} className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <span className="text-xs font-medium text-amber-400 mb-2 block">
                        Porta {idx + 1}
                        {obs.produto && (
                          <span className="text-amber-300/70 ml-2">
                            - {obs.produto.largura && obs.produto.altura 
                                ? `${obs.produto.largura}m × ${obs.produto.altura}m`
                                : obs.produto.tamanho || ''}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300">
                          {OPCOES_INTERNA_EXTERNA[obs.interna_externa as keyof typeof OPCOES_INTERNA_EXTERNA] || obs.interna_externa}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-300">
                          Motor: {OPCOES_LADO_MOTOR[obs.lado_motor as keyof typeof OPCOES_LADO_MOTOR] || obs.lado_motor}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300">
                          {OPCOES_POSICAO_GUIA[obs.posicao_guia as keyof typeof OPCOES_POSICAO_GUIA] || obs.posicao_guia}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-300">
                          {OPCOES_GUIA[obs.opcao_guia as keyof typeof OPCOES_GUIA] || obs.opcao_guia}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-300">
                          Testeira: {OPCOES_APARENCIA_TESTEIRA[obs.aparencia_testeira as keyof typeof OPCOES_APARENCIA_TESTEIRA] || obs.aparencia_testeira}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Ordens de Produção */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Factory className="h-3.5 w-3.5" />
              Ordens de Produção ({ordens.length})
            </h3>
            {loadingOrdens ? (
              <div className="text-sm text-white/50">Carregando...</div>
            ) : ordens.length > 0 ? (
              <div className="space-y-2">
                {ordens.map((ordem) => (
                  <button
                    key={ordem.id}
                    onClick={() => handleOrdemClick(ordem)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {getOrdemIcon(ordem.tipo)}
                      <div className="text-left">
                        <p className="font-medium text-white text-sm">{ordem.tipoLabel}</p>
                        <p className="text-[11px] text-white/40">#{ordem.numero_ordem}</p>
                      </div>
                      {ordem.pausada && (
                        <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
                          Pausada
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {ordem.responsavel?.foto_url ? (
                        <Avatar className="h-7 w-7 border-2 border-white/20">
                          <AvatarImage src={ordem.responsavel.foto_url} alt={ordem.responsavel.nome || ''} />
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      ) : ordem.responsavel?.nome ? (
                        <Avatar className="h-7 w-7 border-2 border-white/20">
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            {ordem.responsavel.iniciais}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <Badge className={cn("text-[11px] border", getStatusColor(ordem.status))}>
                        {getStatusLabel(ordem.status)}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">Nenhuma ordem vinculada</p>
            )}
          </div>

          {/* Histórico de Movimentações */}
          <Collapsible open={historicoOpen} onOpenChange={setHistoricoOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-400" />
                  <span className="font-medium text-white text-sm">Histórico de Movimentações</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-white/60 transition-transform duration-200",
                  historicoOpen && "rotate-180"
                )} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 pl-2">
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <PedidoHistoricoMovimentacoes pedidoId={pedido.id} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Data de Criação */}
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Criado em{' '}
              {venda.created_at 
                ? format(new Date(venda.created_at), "dd/MM/yyyy 'às' HH:mm")
                : pedido.created_at 
                  ? format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm")
                  : "Data não disponível"
              }
            </span>
          </div>
        </div>
      </SheetContent>

      {/* Sheet de linhas da ordem */}
      <OrdemLinhasSheet
        ordem={ordemSelecionada}
        open={showOrdemLinhas}
        onOpenChange={setShowOrdemLinhas}
      />
    </Sheet>
  );
}
