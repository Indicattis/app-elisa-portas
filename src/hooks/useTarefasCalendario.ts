import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

interface TarefaDia {
  data: Date;
  tarefas: Array<{
    id: string;
    descricao: string;
    status: string;
    responsavel_id: string;
    responsavel_nome: string;
    responsavel_foto: string | null;
    recorrente: boolean;
  }>;
  totalPendentes: number;
  totalConcluidas: number;
}

export function useTarefasCalendario(mesAno?: Date) {
  const mesAtual = mesAno || new Date();
  // Busca dados de 3 meses (mês anterior, atual e próximo) para garantir cobertura de semanas que cruzam meses
  const inicio = startOfMonth(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  const fim = endOfMonth(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));

  return useQuery({
    queryKey: ["tarefas-calendario", format(mesAtual, 'yyyy-MM')],
    queryFn: async () => {
      // Buscar todas as tarefas do período usando data_referencia
      const { data: tarefas, error } = await supabase
        .from("tarefas")
        .select(`
          id,
          descricao,
          status,
          responsavel_id,
          data_referencia,
          recorrente
        `)
        .not("data_referencia", "is", null)
        .gte("data_referencia", format(inicio, 'yyyy-MM-dd'))
        .lte("data_referencia", format(fim, 'yyyy-MM-dd'))
        .order("data_referencia");

      if (error) {
        console.error("Erro ao buscar tarefas:", error);
        throw error;
      }

      // Buscar informações dos usuários responsáveis
      const userIds = [...new Set(tarefas?.map(t => t.responsavel_id) || [])];
      const { data: users, error: usersError } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url")
        .in("user_id", userIds);

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError);
      }

      const userMap = new Map(users?.map(u => [u.user_id, u]) || []);

      // Organizar tarefas por dia
      const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });
      const tarefasPorDia: Record<string, TarefaDia> = {};

      diasDoMes.forEach(dia => {
        const diaStr = format(dia, 'yyyy-MM-dd');
        tarefasPorDia[diaStr] = {
          data: dia,
          tarefas: [],
          totalPendentes: 0,
          totalConcluidas: 0,
        };
      });

      tarefas?.forEach(tarefa => {
        const diaStr = tarefa.data_referencia;
        if (diaStr && tarefasPorDia[diaStr]) {
          const user = userMap.get(tarefa.responsavel_id);
          tarefasPorDia[diaStr].tarefas.push({
            id: tarefa.id,
            descricao: tarefa.descricao,
            status: tarefa.status,
            responsavel_id: tarefa.responsavel_id,
            responsavel_nome: user?.nome || 'Desconhecido',
            responsavel_foto: user?.foto_perfil_url || null,
            recorrente: tarefa.recorrente,
          });

          if (tarefa.status === 'em_andamento') {
            tarefasPorDia[diaStr].totalPendentes++;
          } else if (tarefa.status === 'concluida') {
            tarefasPorDia[diaStr].totalConcluidas++;
          }
        }
      });

      // Calcular estatísticas gerais
      const totalTarefas = tarefas?.length || 0;
      const totalConcluidas = tarefas?.filter(t => t.status === 'concluida').length || 0;
      const totalPendentes = tarefas?.filter(t => t.status === 'em_andamento').length || 0;

      return {
        tarefasPorDia,
        stats: {
          totalTarefas,
          totalConcluidas,
          totalPendentes,
        },
      };
    },
  });
}
