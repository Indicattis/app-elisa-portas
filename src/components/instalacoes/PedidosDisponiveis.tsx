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
    cidade: string | null;
    estado: string | null;
    data_prevista_entrega: string | null;
  };
}

interface PedidosDisponiveisProps {
  onRefresh?: () => void;
}

function DraggablePedidoCard({ pedido }: { pedido: PedidoDisponivel }) {
  const isExpedicaoInstalacao = pedido.etapa_atual === 'expedicao_instalacao';
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pedido-${pedido.id}`,
    data: {
      type: 'pedido',
      pedido,
    },
    disabled: !isExpedicaoInstalacao,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getEtapaLabel = (etapa: string) => {
    const etapas: Record<string, string> = {
      aguardando_corte: 'Aguardando Corte',
      em_corte: 'Em Corte',
      aguardando_montagem: 'Aguardando Montagem',
      em_montagem: 'Em Montagem',
      aguardando_pintura: 'Aguardando Pintura',
      em_pintura: 'Em Pintura',
      aguardando_expedicao: 'Aguardando Expedição',
      expedicao_instalacao: 'Expedição Instalação',
      aguardando_instalacao: 'Aguardando Instalação',
      aguardando_coleta: 'Aguardando Coleta',
      concluido: 'Concluído',
    };
    return etapas[etapa] || etapa;
  };

  const getEtapaColor = (etapa: string) => {
    if (etapa === 'expedicao_instalacao') return 'bg-green-500/10 text-green-700 border-green-500/20';
    if (etapa === 'aguardando_instalacao' || etapa === 'aguardando_coleta') return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`transition-colors h-[35px] ${
        isExpedicaoInstalacao 
          ? 'hover:border-primary cursor-grab active:cursor-grabbing' 
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <CardContent className="p-0 h-full">
        <div className="h-full grid grid-cols-[100px_1fr_200px_150px_140px] gap-2 items-center px-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{pedido.numero_pedido}</span>
          </div>

          <div className="truncate">
            {pedido.venda.cliente_nome}
          </div>

          <div className="flex items-center gap-1 text-muted-foreground truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {pedido.venda.cidade && pedido.venda.estado 
                ? `${pedido.venda.cidade} - ${pedido.venda.estado}`
                : pedido.venda.cidade || pedido.venda.estado || '-'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {pedido.venda.data_prevista_entrega 
                ? format(new Date(pedido.venda.data_prevista_entrega), 'dd/MM/yyyy', { locale: ptBR })
                : '-'}
            </span>
          </div>

          <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getEtapaColor(pedido.etapa_atual)}`}>
            {getEtapaLabel(pedido.etapa_atual)}
          </Badge>
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
            cidade,
            estado,
            data_prevista_entrega
          )
        `)
        .order('numero_pedido', { ascending: false });

      if (error) throw error;

      // Buscar instalações existentes para filtrar pedidos que já têm instalação
      const { data: instalacoesExistentes } = await supabase
        .from('instalacoes')
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
      pedido.venda.cidade?.toLowerCase().includes(searchLower) ||
      pedido.venda.estado?.toLowerCase().includes(searchLower)
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
          Apenas pedidos em "Expedição Instalação" podem ser agendados no calendário
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
