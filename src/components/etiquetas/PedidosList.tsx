import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package2 } from 'lucide-react';
import { PedidoResumo } from '@/types/etiqueta';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidosListProps {
  pedidos: PedidoResumo[];
  loading: boolean;
  selectedPedidoId: string | null;
  onSelectPedido: (pedidoId: string) => void;
}

export function PedidosList({ pedidos, loading, selectedPedidoId, onSelectPedido }: PedidosListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map((pedido) => {
        const isSelected = pedido.id === selectedPedidoId;
        
        return (
          <Card 
            key={pedido.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onSelectPedido(pedido.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{pedido.numero_pedido}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {pedido.status}
                </Badge>
              </div>
              
              <p className="text-sm font-medium mb-1">{pedido.cliente_nome}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{pedido.etapa_atual.replace('_', ' ')}</span>
                <span>{format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
