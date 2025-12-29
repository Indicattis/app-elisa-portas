import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Package, Phone, MapPin, Calendar, DollarSign, ListChecks, ShoppingCart, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { PedidoLinhasEditor } from "./PedidoLinhasEditor";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatarNumeroPedidoMensal } from "@/utils/pedidoFormatters";

interface PedidoDetalhesSheetProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PedidoDetalhesSheet({ pedido, open, onOpenChange }: PedidoDetalhesSheetProps) {
  const venda = pedido.vendas;
  const { linhas, isLoading } = usePedidoLinhas(pedido.id);
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(false);
  
  useEffect(() => {
    if (open && pedido?.id) {
      fetchOrdens();
    }
  }, [open, pedido?.id]);

  const fetchOrdens = async () => {
    setLoadingOrdens(true);
    try {
      const ordensData = [];

      // Buscar ordem de soldagem
      const { data: soldagem } = await supabase
        .from("ordens_soldagem")
        .select("id, numero_ordem, status")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (soldagem) ordensData.push({ ...soldagem, tipo: "Soldagem" });

      // Buscar ordem de perfiladeira
      const { data: perfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select("id, numero_ordem, status")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (perfiladeira) ordensData.push({ ...perfiladeira, tipo: "Perfiladeira" });

      // Buscar ordem de separação
      const { data: separacao } = await supabase
        .from("ordens_separacao")
        .select("id, numero_ordem, status")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (separacao) ordensData.push({ ...separacao, tipo: "Separação" });

      // Buscar ordem de qualidade
      const { data: qualidade } = await supabase
        .from("ordens_qualidade")
        .select("id, numero_ordem, status")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (qualidade) ordensData.push({ ...qualidade, tipo: "Qualidade" });

      // Buscar ordem de pintura
      const { data: pintura } = await supabase
        .from("ordens_pintura")
        .select("id, numero_ordem, status")
        .eq("pedido_id", pedido.id)
        .maybeSingle();
      if (pintura) ordensData.push({ ...pintura, tipo: "Pintura" });

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
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case "em_andamento":
        return <Clock className="w-3 h-3 text-blue-600" />;
      case "cancelado":
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: "Aberto",
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
      pronta: "Pronta",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      concluido: "bg-green-500/10 text-green-700 border-green-500/20",
      pronta: "bg-green-500/10 text-green-700 border-green-500/20",
      cancelado: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[status] || "";
  };
  
  if (!venda) return null;

  const produtos = venda.produtos_vendas || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] max-w-[700px] mx-auto rounded-t-xl overflow-y-auto flex flex-col p-0"
      >
        <div className="sticky top-0 bg-background z-10 border-b px-6 py-4">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Detalhes do Pedido</SheetTitle>
              {venda.id && (
                <Button
                  variant="outline"
                  size="sm"
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

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Informações do Pedido */}
          {(pedido.numero_mes || pedido.numero_pedido) && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Número do Pedido</h3>
              <Badge variant="outline" className="text-base">
                {formatarNumeroPedidoMensal(pedido.numero_mes, pedido.mes_vigencia, pedido.numero_pedido)}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Linhas do Pedido */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Linhas do Pedido ({linhas.length})
            </h3>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <div className="space-y-1">
                {linhas.map((linha: any) => (
                  <div key={linha.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div className="flex-1">
                      <p className="font-medium">{linha.nome_produto}</p>
                      {linha.tamanho && (
                        <p className="text-muted-foreground text-[10px]">{linha.tamanho}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {linha.quantidade}x
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Ordens de Produção */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ordens de Produção ({ordens.length})
            </h3>
            {loadingOrdens ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : ordens.length > 0 ? (
              <div className="space-y-2">
                {ordens.map((ordem) => (
                  <div key={ordem.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ordem.status)}
                      <div>
                        <p className="font-medium text-sm">{ordem.tipo}</p>
                        <p className="text-xs text-muted-foreground">#{ordem.numero_ordem}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(ordem.status)} text-xs`}>
                      {getStatusLabel(ordem.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma ordem vinculada</p>
            )}
          </div>

          <Separator />

          {/* Informações do Cliente */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Cliente
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{venda.cliente_nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{venda.cliente_telefone}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Localização */}
          {(venda.cidade || venda.estado) && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">
                      {[venda.cidade, venda.estado].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Produtos */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos ({produtos.length})
            </h3>
            <div className="space-y-2">
              {produtos.map((produto: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{produto.tipo_produto}</p>
                    {produto.cor?.nome && (
                      <p className="text-xs text-muted-foreground">Cor: {produto.cor.nome}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md">
                <span className="text-sm font-medium">Valor Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(venda.valor_venda || 0)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(venda.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
