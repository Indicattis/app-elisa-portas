import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Package, Phone, MapPin, Calendar, DollarSign, ListChecks } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { PedidoLinhasEditor } from "./PedidoLinhasEditor";

interface PedidoDetalhesSheetProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PedidoDetalhesSheet({ pedido, open, onOpenChange }: PedidoDetalhesSheetProps) {
  const venda = pedido.vendas;
  const { linhas, isLoading, adicionarLinha, removerLinha } = usePedidoLinhas(pedido.id);
  
  if (!venda) return null;

  const produtos = venda.produtos_vendas || [];
  const isAberto = pedido.etapa_atual === 'aberto';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Pedido</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações do Pedido */}
          {pedido.numero_pedido && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Número do Pedido</h3>
              <Badge variant="outline" className="text-base">
                {pedido.numero_pedido}
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
              <PedidoLinhasEditor
                linhas={linhas}
                isReadOnly={!isAberto}
                onAdicionarLinha={adicionarLinha}
                onRemoverLinha={removerLinha}
              />
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
