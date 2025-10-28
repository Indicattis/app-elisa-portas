import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Tarefa {
  id: string;
  descricao: string;
  responsavel_id: string;
  status: 'em_andamento' | 'concluida';
  recorrente: boolean;
  dia_recorrencia: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joins
  responsavel?: {
    nome: string;
    email: string;
  };
  criador?: {
    nome: string;
    email: string;
  };
}

export interface TarefaInput {
  descricao: string;
  responsavel_id: string;
  recorrente: boolean;
  dia_recorrencia?: number | null;
}

export function useTarefas(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar tarefas do usuário
  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['tarefas', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: tarefasData, error: tarefasError } = await supabase
        .from('tarefas')
        .select('*')
        .eq('responsavel_id', userId)
        .order('created_at', { ascending: false });

      if (tarefasError) throw tarefasError;
      if (!tarefasData) return [];

      // Buscar informações dos usuários
      const userIds = [
        ...new Set([
          ...tarefasData.map(t => t.responsavel_id),
          ...tarefasData.map(t => t.created_by)
        ])
      ];

      const { data: usersData } = await supabase
        .from('admin_users')
        .select('user_id, nome, email')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);

      return tarefasData.map(tarefa => ({
        ...tarefa,
        responsavel: usersMap.get(tarefa.responsavel_id),
        criador: usersMap.get(tarefa.created_by)
      })) as Tarefa[];
    },
    enabled: !!userId,
  });

  // Criar tarefa
  const criarTarefa = useMutation({
    mutationFn: async (input: TarefaInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('tarefas')
        .insert([{
          descricao: input.descricao,
          responsavel_id: input.responsavel_id,
          recorrente: input.recorrente,
          dia_recorrencia: input.recorrente ? input.dia_recorrencia : null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar tarefa",
        description: error.message,
      });
    },
  });

  // Marcar como concluída
  const marcarConcluida = useMutation({
    mutationFn: async (tarefaId: string) => {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: 'concluida' })
        .eq('id', tarefaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: "Tarefa concluída",
        description: "A tarefa foi marcada como concluída.",
      });
    },
  });

  // Reabrir tarefa
  const reabrirTarefa = useMutation({
    mutationFn: async (tarefaId: string) => {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: 'em_andamento' })
        .eq('id', tarefaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: "Tarefa reaberta",
        description: "A tarefa foi reaberta.",
      });
    },
  });

  // Deletar tarefa (apenas admin/diretor)
  const deletarTarefa = useMutation({
    mutationFn: async (tarefaId: string) => {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', tarefaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: "Tarefa deletada",
        description: "A tarefa foi removida com sucesso.",
      });
    },
  });

  return {
    tarefas,
    isLoading,
    criarTarefa,
    marcarConcluida,
    reabrirTarefa,
    deletarTarefa,
  };
}
