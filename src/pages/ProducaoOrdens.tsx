import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProducaoOrdens() {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);

  // Buscar todos os pedidos
  const { data: pedidos = [], isLoading: pedidosLoading } = useQuery({
    queryKey: ["pedidos-producao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select(`
          id,
          numero_pedido,
          cliente_nome,
          status,
          status_preenchimento,
          created_at,
          venda_id,
          vendas!inner(valor_venda)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar ordens do pedido selecionado
  const { data: ordens = [], isLoading: ordensLoading } = useQuery({
    queryKey: ["ordens-producao", selectedPedidoId],
    queryFn: async () => {
      if (!selectedPedidoId) return [];

      const [perfiladeira, separacao, soldagem, pintura, instalacao] = await Promise.all([
        supabase.from("ordens_perfiladeira").select("*").eq("pedido_id", selectedPedidoId),
        supabase.from("ordens_separacao").select("*").eq("pedido_id", selectedPedidoId),
        supabase.from("ordens_soldagem").select("*").eq("pedido_id", selectedPedidoId),
        supabase.from("ordens_pintura").select("*").eq("pedido_id", selectedPedidoId),
        supabase.from("ordens_instalacao").select("*").eq("pedido_id", selectedPedidoId),
      ]);

      const todasOrdens = [
        ...(perfiladeira.data || []).map(o => ({ ...o, tipo: "Perfiladeira", tipo_id: "perfiladeira" })),
        ...(separacao.data || []).map(o => ({ ...o, tipo: "Separação", tipo_id: "separacao" })),
        ...(soldagem.data || []).map(o => ({ ...o, tipo: "Soldagem", tipo_id: "soldagem" })),
        ...(pintura.data || []).map(o => ({ ...o, tipo: "Pintura", tipo_id: "pintura" })),
        ...(instalacao.data || []).map(o => ({ ...o, tipo: "Instalação", tipo_id: "instalacao" })),
      ];

      return todasOrdens;
    },
    enabled: !!selectedPedidoId,
  });

  const handlePedidoDoubleClick = (pedidoId: string) => {
    setSelectedPedidoId(pedidoId === selectedPedidoId ? null : pedidoId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "default";
      case "em_andamento":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ordens de Produção</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Clique 2x em um pedido para ver suas ordens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Lista de Pedidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              Pedidos Principais ({pedidos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2 pr-4">
                {pedidosLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Carregando pedidos...
                  </p>
                ) : pedidos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum pedido encontrado
                  </p>
                ) : (
                  pedidos.map((pedido: any) => (
                    <div
                      key={pedido.id}
                      onDoubleClick={() => handlePedidoDoubleClick(pedido.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPedidoId === pedido.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {pedido.numero_pedido}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {pedido.cliente_nome}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(pedido.status)} className="text-[10px] shrink-0">
                          {pedido.status === "concluido" ? "Concluído" : "Ativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        <span>{format(new Date(pedido.created_at), "dd/MM/yyyy")}</span>
                        {pedido.vendas?.valor_venda && (
                          <>
                            <span>•</span>
                            <span>
                              R${" "}
                              {pedido.vendas.valor_venda.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Ordens do Pedido Selecionado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              Ordens de Produção
              {selectedPedidoId && ` (${ordens.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {!selectedPedidoId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Selecione um pedido para ver suas ordens
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique 2x em um pedido da lista
                  </p>
                </div>
              ) : ordensLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Carregando ordens...
                </p>
              ) : ordens.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhuma ordem encontrada
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Este pedido ainda não possui ordens de produção
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {ordens.map((ordem: any) => (
                    <Card key={ordem.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {ordem.tipo}
                              </Badge>
                              <Badge
                                variant={ordem.status === "concluido" ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {ordem.status === "concluido" ? "Concluído" : "Pendente"}
                              </Badge>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                              {ordem.numero_ordem}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          {ordem.data_inicio && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Início:</span>
                              <span className="font-medium">
                                {format(new Date(ordem.data_inicio), "dd/MM/yyyy HH:mm")}
                              </span>
                            </div>
                          )}
                          {ordem.data_conclusao && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Conclusão:</span>
                              <span className="font-medium">
                                {format(new Date(ordem.data_conclusao), "dd/MM/yyyy HH:mm")}
                              </span>
                            </div>
                          )}
                          {ordem.observacoes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-muted-foreground mb-1">Observações:</p>
                              <p className="text-xs">{ordem.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
