import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, MapPin, Calendar, Loader2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

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

interface SelecionarPedidoInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSelecionada: Date;
  onPedidoSelecionado?: () => void;
}

export function SelecionarPedidoInstalacaoModal({
  open,
  onOpenChange,
  dataSelecionada,
  onPedidoSelecionado
}: SelecionarPedidoInstalacaoModalProps) {
  const [pedidos, setPedidos] = useState<PedidoDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [criandoInstalacao, setCriandoInstalacao] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchPedidosDisponiveis();
      setSearchTerm('');
    }
  }, [open]);

  const fetchPedidosDisponiveis = async () => {
    try {
      setLoading(true);

      // Buscar pedidos nas etapas aguardando_instalacao e aguardando_coleta
      // que ainda não têm instalação cadastrada
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
        .is('instalacoes_cadastradas.id', null)
        .order('numero_pedido', { ascending: false });

      if (error) throw error;

      const pedidosFormatados: PedidoDisponivel[] = (data || []).map(p => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        etapa_atual: p.etapa_atual,
        venda: Array.isArray(p.vendas) ? p.vendas[0] : p.vendas
      }));

      setPedidos(pedidosFormatados);
    } catch (error) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarPedido = async (pedido: PedidoDisponivel) => {
    try {
      setCriandoInstalacao(true);

      // Formatar data no formato YYYY-MM-DD
      const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');

      // Criar instalação vinculada ao pedido
      const { error: insertError } = await supabase
        .from('instalacoes_cadastradas')
        .insert({
          pedido_id: pedido.id,
          venda_id: pedido.venda.id,
          nome_cliente: pedido.venda.cliente_nome,
          telefone_cliente: pedido.venda.cliente_telefone,
          cidade: pedido.venda.cliente_cidade || '',
          estado: pedido.venda.cliente_estado || '',
          data_instalacao: dataFormatada,
          status: 'pronta_fabrica',
          tipo_instalacao: null, // Sem responsável inicialmente
          responsavel_instalacao_id: null,
          responsavel_instalacao_nome: null
        });

      if (insertError) throw insertError;

      // Atualizar data_carregamento do pedido
      const { error: updateError } = await supabase
        .from('pedidos_producao')
        .update({ data_carregamento: dataFormatada })
        .eq('id', pedido.id);

      if (updateError) throw updateError;

      toast.success('Instalação criada com sucesso!');
      onOpenChange(false);
      onPedidoSelecionado?.();
    } catch (error) {
      console.error('Erro ao criar instalação:', error);
      toast.error('Erro ao criar instalação');
    } finally {
      setCriandoInstalacao(false);
    }
  };

  // Filtrar pedidos por busca
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Pedido para Instalação</DialogTitle>
          <DialogDescription>
            Criar instalação para {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        {/* Barra de pesquisa */}
        {!loading && pedidos.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por pedido, cliente ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pedido disponível para instalação
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pedido encontrado com "{searchTerm}"
          </div>
        ) : (
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-3">
              {pedidosFiltrados.map((pedido) => (
                <Card key={pedido.id} className="hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{pedido.numero_pedido}</span>
                          <span className="text-xs text-muted-foreground">
                            ({pedido.etapa_atual === 'aguardando_instalacao' ? 'Aguardando Instalação' : 'Aguardando Coleta'})
                          </span>
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
                            <span>Entrega prevista: {format(new Date(pedido.venda.data_prevista_entrega), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleSelecionarPedido(pedido)}
                        disabled={criandoInstalacao}
                        size="sm"
                      >
                        {criandoInstalacao ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Selecionar'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
