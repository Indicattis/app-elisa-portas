import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, Truck, MapPin, Loader2 } from 'lucide-react';
import { OrdemCarregamento } from '@/types/ordemCarregamento';

interface OrdensCarregamentoDisponiveisProps {
  onRefresh?: () => void;
}

export function OrdensCarregamentoDisponiveis({ onRefresh }: OrdensCarregamentoDisponiveisProps) {
  const [ordens, setOrdens] = useState<OrdemCarregamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrdensDisponiveis();
  }, []);

  const fetchOrdensDisponiveis = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ordens_carregamento')
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .is('data_carregamento', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrdens((data || []) as OrdemCarregamento[]);
    } catch (error) {
      console.error('Erro ao buscar ordens disponíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const ordensFiltradas = ordens.filter(ordem => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ordem.nome_cliente.toLowerCase().includes(searchLower) ||
      ordem.pedido?.numero_pedido.toLowerCase().includes(searchLower) ||
      ordem.venda?.cidade?.toLowerCase().includes(searchLower) ||
      ordem.venda?.estado?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'agendada':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Ordens Disponíveis para Agendamento
          <Badge variant="secondary" className="ml-auto">
            {ordens.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Arraste as ordens para o calendário para agendar o carregamento
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {ordens.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, pedido ou localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {ordensFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? `Nenhuma ordem encontrada com "${searchTerm}"` : 'Nenhuma ordem disponível para agendamento'}
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {ordensFiltradas.map((ordem) => (
                    <Card key={ordem.id} className="p-3 hover:border-primary/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{ordem.nome_cliente}</h4>
                            <p className="text-xs text-muted-foreground">
                              Pedido: {ordem.pedido?.numero_pedido || 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${getStatusColor(ordem.status)}`}>
                            {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Autorizado'}
                          </Badge>
                        </div>

                        {ordem.venda && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {ordem.venda.cidade}/{ordem.venda.estado}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
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
