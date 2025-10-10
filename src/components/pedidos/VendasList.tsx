import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Venda } from "@/hooks/useVendasPedidos";

interface VendasListProps {
  vendas: Venda[];
  selectedVendaId: string | null;
  onSelectVenda: (vendaId: string) => void;
}

export const VendasList = ({ vendas, selectedVendaId, onSelectVenda }: VendasListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Vendas</h2>
        <Badge variant="secondary">{vendas.length}</Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-2 pr-4">
          {vendas.map((venda) => {
            const isSelected = venda.id === selectedVendaId;
            const temPedido = venda.pedidos_producao && venda.pedidos_producao.length > 0;

            return (
              <Card
                key={venda.id}
                className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
                onClick={() => onSelectVenda(venda.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Venda #{venda.id.slice(0, 8)}</span>
                    {temPedido && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Com Pedido
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{venda.cliente_nome}</span>
                    </div>
                    
                    {venda.cliente_telefone && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📞 {venda.cliente_telefone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-primary">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(venda.valor_venda)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(venda.created_at), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
