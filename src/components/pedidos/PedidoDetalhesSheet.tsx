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
  FolderOpen, ChevronDown, User, Wrench, Factory
} from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatarNumeroPedidoMensal } from "@/utils/pedidoFormatters";
import { PedidoFluxogramaMap } from "./PedidoFluxogramaMap";

interface PedidoDetalhesSheetProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrdemProducao {
  id: string;
  numero_ordem: string | number;
  status: string;
  tipo: string;
  responsavel_id: string | null;
  responsavel_foto: string | null;
  responsavel_nome: string | null;
}

export function PedidoDetalhesSheet({ pedido, open, onOpenChange }: PedidoDetalhesSheetProps) {
  const venda = pedido.vendas;
  const { linhas, isLoading } = usePedidoLinhas(pedido.id);
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(false);
  const [linhasOpen, setLinhasOpen] = useState(false);
  const [itensOpen, setItensOpen] = useState(false);
  
  useEffect(() => {
    if (open && pedido?.id) {
      fetchOrdens();
    }
  }, [open, pedido?.id]);

  const fetchOrdens = async () => {
    setLoadingOrdens(true);
    try {
      const ordensData: OrdemProducao[] = [];

      // Helper para buscar info do responsável
      const fetchResponsavel = async (responsavel_id: string | null) => {
        if (!responsavel_id) return { foto: null, nome: null };
        const { data: user } = await supabase
          .from('admin_users')
          .select('foto_perfil_url, nome')
          .eq('user_id', responsavel_id)
          .maybeSingle();
        return { foto: user?.foto_perfil_url || null, nome: user?.nome || null };
      };

      // Buscar ordem de soldagem
      const { data: soldagem } = await supabase
        .from("ordens_soldagem")
        .select("id, numero_ordem, status, responsavel_id")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (soldagem) {
        const resp = await fetchResponsavel(soldagem.responsavel_id);
        ordensData.push({ 
          ...soldagem, 
          tipo: "Soldagem",
          responsavel_foto: resp.foto,
          responsavel_nome: resp.nome
        });
      }

      // Buscar ordem de perfiladeira
      const { data: perfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select("id, numero_ordem, status, responsavel_id")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (perfiladeira) {
        const resp = await fetchResponsavel(perfiladeira.responsavel_id);
        ordensData.push({ 
          ...perfiladeira, 
          tipo: "Perfiladeira",
          responsavel_foto: resp.foto,
          responsavel_nome: resp.nome
        });
      }

      // Buscar ordem de separação
      const { data: separacao } = await supabase
        .from("ordens_separacao")
        .select("id, numero_ordem, status, responsavel_id")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (separacao) {
        const resp = await fetchResponsavel(separacao.responsavel_id);
        ordensData.push({ 
          ...separacao, 
          tipo: "Separação",
          responsavel_foto: resp.foto,
          responsavel_nome: resp.nome
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
          ...qualidade, 
          tipo: "Qualidade",
          responsavel_foto: resp.foto,
          responsavel_nome: resp.nome
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
          ...pintura, 
          tipo: "Pintura",
          responsavel_foto: resp.foto,
          responsavel_nome: resp.nome
        });
      }

      setOrdens(ordensData);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
    } finally {
      setLoadingOrdens(false);
    }
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

  const getOrdemIcon = (tipo: string) => {
    switch (tipo) {
      case "Soldagem":
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case "Perfiladeira":
        return <Factory className="w-4 h-4 text-purple-400" />;
      case "Separação":
        return <Package className="w-4 h-4 text-cyan-400" />;
      case "Qualidade":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "Pintura":
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
                  <div key={ordem.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      {getOrdemIcon(ordem.tipo)}
                      <div>
                        <p className="font-medium text-white text-sm">{ordem.tipo}</p>
                        <p className="text-[11px] text-white/40">#{ordem.numero_ordem}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {ordem.responsavel_foto ? (
                        <Avatar className="h-7 w-7 border-2 border-white/20">
                          <AvatarImage src={ordem.responsavel_foto} alt={ordem.responsavel_nome || ''} />
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      ) : ordem.responsavel_nome ? (
                        <Avatar className="h-7 w-7 border-2 border-white/20">
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            {ordem.responsavel_nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <Badge className={cn("text-[11px] border", getStatusColor(ordem.status))}>
                        {getStatusLabel(ordem.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">Nenhuma ordem vinculada</p>
            )}
          </div>

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
    </Sheet>
  );
}
