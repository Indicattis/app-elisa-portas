import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package, MapPin, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface PedidoDisponivel {
  id: string;
  numero_pedido: string;
  etapa_atual: string;
  venda: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cliente_cidade: string | null;
    cliente_estado: string | null;
    data_prevista_entrega: string | null;
  };
}

interface PedidosDisponiveisProps {
  onRefresh?: () => void;
}

function DraggablePedidoCard({ pedido }: { pedido: PedidoDisponivel }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pedido-${pedido.id}`,
    data: {
      type: 'pedido',
      pedido,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="hover:border-primary transition-colors cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{pedido.numero_pedido}</span>
            <Badge variant="outline" className="text-xs">
              {pedido.etapa_atual === 'aguardando_instalacao' ? 'Aguardando Instalação' : 'Aguardando Coleta'}
            </Badge>
          </div>

          <div className="text-sm">
            <strong>Cliente:</strong> {pedido.venda.cliente_nome}
          </div>

          {(pedido.venda.cliente_cidade || pedido.venda.cliente_estado) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {pedido.venda.cliente_cidade && <span>{pedido.venda.cliente_cidade}</span>}
              {pedido.venda.cliente_cidade && pedido.venda.cliente_estado && <span>-</span>}
              {pedido.venda.cliente_estado && <span>{pedido.venda.cliente_estado}</span>}
            </div>
          )}

          {pedido.venda.data_prevista_entrega && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Entrega prevista: {format(new Date(pedido.venda.data_prevista_entrega), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PedidosDisponiveis({ onRefresh }: PedidosDisponiveisProps) {
  const [pedidos, setPedidos] = useState<PedidoDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPedidosDisponiveis();
  }, []);

  const fetchPedidosDisponiveis = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pedidos_producao')
        .select(`
          id,
          numero_pedido,
          etapa_atual,
          vendas!inner (
            id,
            cliente_nome,
            cliente_telefone,
            cliente_cidade,
            cliente_estado,
            data_prevista_entrega
          )
        `)
        .in('etapa_atual', ['aguardando_instalacao', 'aguardando_coleta'])
        .order('numero_pedido', { ascending: false });

      if (error) throw error;

      // Buscar instalações existentes para filtrar pedidos que já têm instalação
      const { data: instalacoesExistentes } = await supabase
        .from('instalacoes_cadastradas')
        .select('pedido_id')
        .not('pedido_id', 'is', null);

      const pedidosComInstalacao = new Set(
        instalacoesExistentes?.map(i => i.pedido_id) || []
      );

      const pedidosFormatados: PedidoDisponivel[] = (data || [])
        .filter(p => !pedidosComInstalacao.has(p.id))
        .map(p => ({
          id: p.id,
          numero_pedido: p.numero_pedido,
          etapa_atual: p.etapa_atual,
          venda: Array.isArray(p.vendas) ? p.vendas[0] : p.vendas
        }));

      setPedidos(pedidosFormatados);
    } catch (error) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pedido.numero_pedido.toLowerCase().includes(searchLower) ||
      pedido.venda.cliente_nome.toLowerCase().includes(searchLower) ||
      pedido.venda.cliente_cidade?.toLowerCase().includes(searchLower) ||
      pedido.venda.cliente_estado?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pedidos Disponíveis para Agendamento
          <Badge variant="secondary" className="ml-auto">
            {pedidos.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Arraste os pedidos para o calendário para criar instalações
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {pedidos.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por pedido, cliente ou localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {pedidosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? `Nenhum pedido encontrado com "${searchTerm}"` : 'Nenhum pedido disponível para agendamento'}
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {pedidosFiltrados.map((pedido) => (
                    <DraggablePedidoCard key={pedido.id} pedido={pedido} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
