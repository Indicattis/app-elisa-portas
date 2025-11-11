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
  const inicio = startOfMonth(mesAtual);
  const fim = endOfMonth(mesAtual);

  return useQuery({
    queryKey: ["tarefas-calendario", format(inicio, 'yyyy-MM')],
    queryFn: async () => {
      // Buscar todas as tarefas do mês
      const { data: tarefas, error } = await supabase
        .from("tarefas")
        .select(`
          id,
          descricao,
          status,
          responsavel_id,
          created_at,
          recorrente
        `)
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at");

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
        const diaStr = format(new Date(tarefa.created_at), 'yyyy-MM-dd');
        if (tarefasPorDia[diaStr]) {
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
