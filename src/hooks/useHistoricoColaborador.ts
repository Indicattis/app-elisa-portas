import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrdemHistoricoColaborador {
  id: string;
  numero_ordem: string;
  setor: 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';
  status: string;
  data_conclusao: string;
  tempo_conclusao_segundos: number | null;
  pedido_id: string;
  cliente_nome?: string;
}

type SetorType = 'todos' | 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

interface UseHistoricoColaboradorOptions {
  userId: string;
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos';
  setor?: SetorType;
}

export function useHistoricoColaborador(options: UseHistoricoColaboradorOptions) {
  const { userId, periodo = 'todos', setor = 'todos' } = options;

  const getDataInicio = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoje':
        return hoje.toISOString();
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        return inicioSemana.toISOString();
      case 'mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return inicioMes.toISOString();
      default:
        return null;
    }
  };

  return useQuery({
    queryKey: ['historico-colaborador', userId, periodo, setor],
    queryFn: async () => {
      if (!userId) return [];

      const dataInicio = getDataInicio();
      const ordens: OrdemHistoricoColaborador[] = [];

      // Definir quais setores buscar
      const setores = setor === 'todos' 
        ? ['soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura'] as const
        : [setor] as const;

      // Buscar de cada tabela de ordens
      for (const setorAtual of setores) {
        const tabela = `ordens_${setorAtual}` as const;
        
        let query = supabase
          .from(tabela)
          .select(`
            id,
            numero_ordem,
            status,
            data_conclusao,
            tempo_conclusao_segundos,
            pedido_id,
            pedido:pedidos_producao(cliente_nome)
          `)
          .eq('responsavel_id', userId)
          .eq('status', 'concluido')
          .order('data_conclusao', { ascending: false });

        if (dataInicio) {
          query = query.gte('data_conclusao', dataInicio);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Erro ao buscar ordens de ${setorAtual}:`, error);
          continue;
        }

        if (data) {
          ordens.push(...data.map((ordem: any) => ({
            id: ordem.id,
            numero_ordem: ordem.numero_ordem,
            setor: setorAtual,
            status: ordem.status,
            data_conclusao: ordem.data_conclusao,
            tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
            pedido_id: ordem.pedido_id,
            cliente_nome: ordem.pedido?.cliente_nome
          })));
        }
      }

      // Ordenar por data de conclusão (mais recentes primeiro)
      return ordens.sort((a, b) => 
        new Date(b.data_conclusao).getTime() - new Date(a.data_conclusao).getTime()
      );
    },
    enabled: !!userId,
  });
}

export function useColaboradorInfo(userId: string) {
  return useQuery({
    queryKey: ['colaborador-info', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, user_id, nome, foto_perfil_url, setor')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
