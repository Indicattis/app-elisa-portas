import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Factory, Calendar, User, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProdutoPedido {
  tipo: string;
  quantidade: number;
  largura?: number;
  altura?: number;
}

interface PedidoProducao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: string;
  data_carregamento: string | null;
  created_at: string;
  valor_venda: number | null;
  produtos: ProdutoPedido[] | null;
}

const etapaLabels: Record<string, string> = {
  aberto: 'Aberto',
  em_producao: 'Em Produção',
  inspecao_qualidade: 'Qualidade',
  aguardando_pintura: 'Pintura',
  aguardando_coleta: 'Ag. Coleta',
  aguardando_instalacao: 'Ag. Instalação',
  finalizado: 'Finalizado',
};

const etapaColors: Record<string, string> = {
  aberto: 'bg-slate-500',
  em_producao: 'bg-blue-500',
  inspecao_qualidade: 'bg-purple-500',
  aguardando_pintura: 'bg-orange-500',
  aguardando_coleta: 'bg-emerald-500',
  aguardando_instalacao: 'bg-cyan-500',
  finalizado: 'bg-green-500',
};

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function PedidosEmProducao() {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-em-producao-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select('id, numero_pedido, cliente_nome, etapa_atual, data_carregamento, created_at, valor_venda, produtos')
        .in('status', ['pendente', 'em_andamento'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as PedidoProducao[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const pedidosChunks = chunkArray(pedidos, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-5 w-5 text-primary" />
            Pedidos em Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-5 w-5 text-primary" />
            Pedidos em Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pedido em produção no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="h-5 w-5 text-primary" />
          Pedidos em Produção
          <Badge variant="secondary" className="ml-auto">
            {pedidos.length} pedidos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <Carousel opts={{ align: 'start' }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {pedidosChunks.map((chunk, slideIndex) => (
              <CarouselItem key={slideIndex} className="pl-2 md:pl-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {chunk.map((pedido) => (
                    <Card 
                      key={pedido.id} 
                      className="border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            #{pedido.numero_pedido}
                          </span>
                          <Badge 
                            className={`${etapaColors[pedido.etapa_atual] || 'bg-slate-500'} text-white text-[10px] px-1.5`}
                          >
                            {etapaLabels[pedido.etapa_atual] || pedido.etapa_atual}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{pedido.cliente_nome}</span>
                        </div>

                        {pedido.produtos && pedido.produtos.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span className="truncate">
                              {pedido.produtos.length} {pedido.produtos.length === 1 ? 'produto' : 'produtos'}
                              {' · '}
                              {pedido.produtos.reduce((acc, p) => acc + (p.quantidade || 1), 0)} un
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                          {pedido.valor_venda ? (
                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {pedido.valor_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          
                          {pedido.data_carregamento && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(pedido.data_carregamento), "dd/MM", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {pedidosChunks.length > 1 && (
            <>
              <CarouselPrevious className="left-0 -translate-x-1/2" />
              <CarouselNext className="right-0 translate-x-1/2" />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
}
