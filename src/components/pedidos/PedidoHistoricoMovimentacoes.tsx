import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, AlertTriangle, TrendingUp, Shuffle, Plus } from "lucide-react";
import { ETAPAS_CONFIG } from "@/types/pedidoEtapa";

interface PedidoHistoricoMovimentacoesProps {
  pedidoId: string;
}

interface Movimentacao {
  id: string;
  etapa_origem?: string;
  etapa_destino: string;
  teor: 'avanco' | 'backlog' | 'reorganizacao' | 'criacao';
  descricao?: string;
  data_hora: string;
  admin_users?: {
    nome: string;
  };
}

const TEOR_CONFIG = {
  backlog: {
    label: 'Backlog',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    className: 'bg-destructive text-destructive-foreground'
  },
  avanco: {
    label: 'Avanço',
    icon: TrendingUp,
    variant: 'default' as const,
    className: 'bg-primary text-primary-foreground'
  },
  reorganizacao: {
    label: 'Reorganização',
    icon: Shuffle,
    variant: 'secondary' as const,
    className: 'bg-secondary text-secondary-foreground'
  },
  criacao: {
    label: 'Criação',
    icon: Plus,
    variant: 'outline' as const,
    className: 'bg-accent text-accent-foreground'
  }
};

export function PedidoHistoricoMovimentacoes({ pedidoId }: PedidoHistoricoMovimentacoesProps) {
  const { data: movimentacoes, isLoading, error: queryError } = useQuery({
    queryKey: ['pedido-movimentacoes', pedidoId],
    queryFn: async () => {
      console.log('Buscando movimentações para pedido:', pedidoId);
      
      const { data, error } = await supabase
        .from('pedidos_movimentacoes')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('data_hora', { ascending: false });

      if (error) {
        console.error('Erro ao buscar movimentações:', error);
        throw error;
      }
      
      console.log('Movimentações encontradas:', data);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Buscar informações dos usuários manualmente
      const movimentacoesComUsuarios = await Promise.all(
        data.map(async (mov) => {
          if (!mov.user_id) {
            return {
              ...mov,
              admin_users: undefined
            };
          }
          
          const { data: userData, error: userError } = await supabase
            .from('admin_users')
            .select('nome')
            .eq('user_id', mov.user_id)
            .maybeSingle();
          
          if (userError) {
            console.error('Erro ao buscar usuário:', userError);
          }
          
          return {
            ...mov,
            admin_users: userData ? { nome: userData.nome } : undefined
          };
        })
      );
      
      console.log('Movimentações com usuários:', movimentacoesComUsuarios);
      
      return movimentacoesComUsuarios as Movimentacao[];
    },
    enabled: !!pedidoId
  });

  // Log error if any
  if (queryError) {
    console.error('Query error:', queryError);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!movimentacoes || movimentacoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma movimentação registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {movimentacoes.map((mov, index) => {
        const config = TEOR_CONFIG[mov.teor as keyof typeof TEOR_CONFIG] || TEOR_CONFIG.avanco;
        const Icon = config.icon;
        const isLast = index === movimentacoes.length - 1;

        return (
          <div key={mov.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.className} flex items-center justify-center z-10`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={config.variant} className="text-xs">
                      {config.label}
                    </Badge>
                    {mov.etapa_origem && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{ETAPAS_CONFIG[mov.etapa_origem]?.label || mov.etapa_origem}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{ETAPAS_CONFIG[mov.etapa_destino]?.label || mov.etapa_destino}</span>
                      </div>
                    )}
                    {!mov.etapa_origem && (
                      <span className="text-xs text-muted-foreground">
                        {ETAPAS_CONFIG[mov.etapa_destino]?.label || mov.etapa_destino}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(mov.data_hora), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {mov.descricao && (
                  <p className={`text-sm mt-1 ${mov.teor === 'backlog' ? 'text-destructive' : 'text-foreground'}`}>
                    {mov.descricao}
                  </p>
                )}

                {mov.admin_users && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Por: {mov.admin_users.nome}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
