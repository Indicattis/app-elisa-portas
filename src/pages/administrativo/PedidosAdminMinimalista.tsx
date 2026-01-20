import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Calendar, ChevronRight, Truck, Wrench } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PedidoAberto {
  id: string;
  numero_pedido: string;
  etapa_atual: string;
  created_at: string;
  vendas: {
    cliente_nome: string;
    cidade?: string;
    estado?: string;
    valor_venda?: number;
    tipo_entrega?: string;
  } | null;
}

export default function PedidosAdminMinimalista() {
  const navigate = useNavigate();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-abertos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select(`
          id,
          numero_pedido,
          etapa_atual,
          created_at,
          vendas:venda_id (
            cliente_nome,
            cidade,
            estado,
            valor_venda,
            tipo_entrega
          )
        `)
        .eq('etapa_atual', 'aberto')
        .eq('arquivado', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as PedidoAberto[];
    }
  });

  return (
    <MinimalistLayout
      title="Pedidos"
      subtitle={`${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} em aberto`}
      backPath="/administrativo"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-white/60">Nenhum pedido em aberto</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pedidos.map((pedido) => (
            <Card 
              key={pedido.id}
              className="bg-primary/5 border-primary/10 backdrop-blur-xl cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => navigate(`/administrativo/pedidos/${pedido.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Número do pedido e badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">
                        #{pedido.numero_pedido}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs"
                      >
                        Aberto
                      </Badge>
                    </div>
                    
                    {/* Nome do cliente */}
                    <p className="text-white/80 font-medium truncate">
                      {pedido.vendas?.cliente_nome || 'Cliente não informado'}
                    </p>
                    
                    {/* Informações adicionais */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/50">
                      {pedido.vendas?.cidade && pedido.vendas?.estado && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{pedido.vendas.cidade}, {pedido.vendas.estado}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      
                      {pedido.vendas?.tipo_entrega && (
                        <div className="flex items-center gap-1">
                          {pedido.vendas.tipo_entrega === 'instalacao' ? (
                            <Wrench className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          <span className="capitalize">{pedido.vendas.tipo_entrega}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Valor e seta */}
                  <div className="flex items-center gap-3 shrink-0">
                    {pedido.vendas?.valor_venda && (
                      <div className="text-right">
                        <p className="text-xs text-white/50">Valor</p>
                        <p className="text-white font-semibold">
                          R$ {Number(pedido.vendas.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MinimalistLayout>
  );
}
