import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { useVendasPedidos } from "@/hooks/useVendasPedidos";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function Pedidos() {
  const { toast } = useToast();
  const { vendas, criarPedidoPrincipal, loading } = useVendasPedidos();

  const handleCriarPedido = async (vendaId: string) => {
    try {
      await criarPedidoPrincipal(vendaId);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const vendasComPedido = vendas.filter(v => v.pedidos_producao && v.pedidos_producao.length > 0);
  const vendasSemPedido = vendas.filter(v => !v.pedidos_producao || v.pedidos_producao.length === 0);

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pedidos de Produção</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Listagem de vendas e pedidos vinculados</p>
        </div>
      </div>

      {/* Vendas SEM Pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Vendas sem Pedido ({vendasSemPedido.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vendasSemPedido.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todas as vendas já têm pedidos vinculados
              </p>
            ) : (
              vendasSemPedido.map((venda) => (
                <div
                  key={venda.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{venda.cliente_nome}</p>
                      <Badge variant="destructive" className="text-[10px] shrink-0">Sem Pedido</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{venda.cliente_telefone}</span>
                      <span>•</span>
                      <span>{formatCurrency(venda.valor_venda)}</span>
                      <span>•</span>
                      <span>{format(new Date(venda.created_at), "dd/MM/yyyy")}</span>
                    </div>
                    {venda.produtos_vendas && venda.produtos_vendas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {venda.produtos_vendas.slice(0, 3).map((prod: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {prod.tipo_produto} {prod.cor?.nome && `- ${prod.cor.nome}`}
                          </Badge>
                        ))}
                        {venda.produtos_vendas.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{venda.produtos_vendas.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCriarPedido(venda.id)}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Criar Pedido
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendas COM Pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Vendas com Pedido ({vendasComPedido.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vendasComPedido.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda com pedido vinculado ainda
              </p>
            ) : (
              vendasComPedido.map((venda) => {
                const pedido = venda.pedidos_producao?.[0];
                return (
                  <div
                    key={venda.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{venda.cliente_nome}</p>
                        <Badge variant="default" className="text-[10px] shrink-0">
                          {pedido?.status === "concluido" ? "Concluído" : "Em Produção"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{venda.cliente_telefone}</span>
                        <span>•</span>
                        <span>{formatCurrency(venda.valor_venda)}</span>
                        <span>•</span>
                        <span>{format(new Date(venda.created_at), "dd/MM/yyyy")}</span>
                      </div>
                      {venda.produtos_vendas && venda.produtos_vendas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {venda.produtos_vendas.slice(0, 3).map((prod: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {prod.tipo_produto} {prod.cor?.nome && `- ${prod.cor.nome}`}
                            </Badge>
                          ))}
                          {venda.produtos_vendas.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{venda.produtos_vendas.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
