import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package2 } from 'lucide-react';
import { PedidoResumo } from '@/types/etiqueta';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PedidosListProps {
  pedidos: PedidoResumo[];
  loading: boolean;
  selectedPedidoId: string | null;
  onSelectPedido: (pedidoId: string) => void;
  filtro: string;
}

export function PedidosList({ pedidos, loading, selectedPedidoId, onSelectPedido, filtro }: PedidosListProps) {
  // Buscar contagens de linhas para todos os pedidos
  const { data: contagensLinhas = {} } = useQuery({
    queryKey: ['pedidos-linhas-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_linhas')
        .select('pedido_id');

      if (error) throw error;

      // Contar linhas por pedido
      const counts: Record<string, number> = {};
      data?.forEach((linha) => {
        counts[linha.pedido_id] = (counts[linha.pedido_id] || 0) + 1;
      });

      return counts;
    },
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const termo = filtro.toLowerCase();
    return (
      pedido.numero_pedido.toLowerCase().includes(termo) ||
      pedido.cliente_nome?.toLowerCase().includes(termo) ||
      pedido.status?.toLowerCase().includes(termo)
    );
  });

  if (pedidosFiltrados.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Package2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Nenhum pedido encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-1">
      <div className="space-y-2">
        {pedidosFiltrados.map((pedido) => {
        const isSelected = pedido.id === selectedPedidoId;
        const numLinhas = contagensLinhas[pedido.id] || 0;
        
        return (
          <Card 
            key={pedido.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onSelectPedido(pedido.id)}
          >
            <CardContent className="p-2.5">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Package2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-xs">{pedido.numero_pedido}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {pedido.status}
                  </Badge>
                  {numLinhas > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {numLinhas} {numLinhas === 1 ? 'linha' : 'linhas'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-xs font-medium mb-0.5 truncate">{pedido.cliente_nome}</p>
              
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="capitalize truncate">{pedido.etapa_atual.replace('_', ' ')}</span>
                <span className="ml-2 shrink-0">{format(new Date(pedido.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </ScrollArea>
  );
}
