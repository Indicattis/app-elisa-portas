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
  tipo_recorrencia: string | null;
  template_id: string | null;
  data_referencia: string | null;
  setor: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joins
  responsavel?: {
    nome: string;
    email: string;
    role: string;
  };
  criador?: {
    nome: string;
    email: string;
  };
}

export interface TarefaTemplate {
  id: string;
  descricao: string;
  responsavel_id: string;
  setor: string | null;
  tipo_recorrencia: string;
  ativa: boolean;
  data_proxima_criacao: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  responsavel?: {
    nome: string;
    email: string;
    role: string;
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
  tipo_recorrencia?: 'todos_os_dias' | 'primeiro_dia_mes' | 'cada_7_dias' | 'cada_15_dias' | 'cada_30_dias' | null;
  setor: string;
}

export function useTarefas(userId?: string, setor?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar tarefas do usuário
  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['tarefas', userId, setor],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('tarefas')
        .select('id, descricao, responsavel_id, status, recorrente, tipo_recorrencia, template_id, data_referencia, setor, created_by, created_at, updated_at');

      // Se setor foi especificado, buscar tarefas de todos os usuários do setor
      if (setor) {
        query = query.eq('setor', setor);
      } else {
        // Caso contrário, apenas as do usuário
        query = query.eq('responsavel_id', userId);
      }

      const { data: tarefasData, error: tarefasError } = await query
        .order('created_at', { ascending: false });

      if (tarefasError) throw tarefasError;
      if (!tarefasData) return [];

      // Buscar informações dos usuários
      const userIds = [
        ...new Set([
          ...tarefasData.map((t: any) => t.responsavel_id),
          ...tarefasData.map((t: any) => t.created_by)
        ])
      ];

      const { data: usersData } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, role')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);

      return tarefasData.map((tarefa: any) => ({
        ...tarefa,
        dia_recorrencia: null,
        responsavel: usersMap.get(tarefa.responsavel_id),
        criador: usersMap.get(tarefa.created_by)
      })) as Tarefa[];
    },
    enabled: !!userId,
  });

  // Buscar templates recorrentes
  const { data: templates = [] } = useQuery({
    queryKey: ['tarefas-templates', setor],
    queryFn: async () => {
      let query = supabase
        .from('tarefas_templates' as any)
        .select('id, descricao, responsavel_id, setor, tipo_recorrencia, ativa, data_proxima_criacao, created_by, created_at, updated_at');
      
      if (setor) {
        query = query.eq('setor', setor);
      }
      
      const { data: templatesData, error: templatesError } = await query
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      if (!templatesData) return [];

      // Buscar informações dos usuários
      const userIds = [
        ...new Set([
          ...templatesData.map((t: any) => t.responsavel_id),
          ...templatesData.map((t: any) => t.created_by)
        ])
      ];

      const { data: usersData } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, role')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);

      return templatesData.map((template: any) => ({
        ...template,
        responsavel: usersMap.get(template.responsavel_id),
        criador: usersMap.get(template.created_by)
      })) as TarefaTemplate[];
    },
    enabled: !!userId,
  });

  // Criar template de recorrência
  const criarTemplate = useMutation({
    mutationFn: async (input: TarefaInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (!input.tipo_recorrencia) {
        throw new Error('Tipo de recorrência é obrigatório');
      }

      // Calcular primeira data de criação
      let proximaData = new Date();
      switch (input.tipo_recorrencia) {
        case 'todos_os_dias':
          proximaData.setDate(proximaData.getDate() + 1);
          break;
        case 'primeiro_dia_mes':
          proximaData.setMonth(proximaData.getMonth() + 1);
          proximaData.setDate(1);
          break;
        case 'cada_7_dias':
          proximaData.setDate(proximaData.getDate() + 7);
          break;
        case 'cada_15_dias':
          proximaData.setDate(proximaData.getDate() + 15);
          break;
        case 'cada_30_dias':
          proximaData.setDate(proximaData.getDate() + 30);
          break;
      }

      const { data, error } = await supabase
        .from('tarefas_templates' as any)
        .insert({
          descricao: input.descricao,
          responsavel_id: input.responsavel_id,
          setor: input.setor,
          tipo_recorrencia: input.tipo_recorrencia,
          data_proxima_criacao: proximaData.toISOString().split('T')[0],
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-templates'] });
      toast({
        title: "Template criado",
        description: "A tarefa recorrente foi configurada e será criada automaticamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar template",
        description: error.message,
      });
    },
  });

  // Criar tarefa única (não recorrente)
  const criarTarefa = useMutation({
    mutationFn: async (input: TarefaInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('tarefas')
        .insert([{
          descricao: input.descricao,
          responsavel_id: input.responsavel_id,
          recorrente: false,
          tipo_recorrencia: null,
          setor: input.setor,
          data_referencia: new Date().toISOString().split('T')[0],
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

  // Marcar como concluída + registrar histórico
  const marcarConcluida = useMutation({
    mutationFn: async (tarefaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Buscar dados da tarefa
      const { data: tarefa } = await supabase
        .from('tarefas')
        .select('id, template_id, data_referencia')
        .eq('id', tarefaId)
        .single();
      
      if (!tarefa) throw new Error('Tarefa não encontrada');

      // Marcar como concluída
      const { error: updateError } = await supabase
        .from('tarefas')
        .update({ status: 'concluida', updated_at: new Date().toISOString() })
        .eq('id', tarefaId);

      if (updateError) throw updateError;

      // Se for recorrente, registrar no histórico
      if ((tarefa as any).template_id && (tarefa as any).data_referencia) {
        const { error: historicoError } = await supabase
          .from('tarefas_historico' as any)
          .insert({
            template_id: (tarefa as any).template_id,
            tarefa_id: tarefaId,
            data_referencia: (tarefa as any).data_referencia,
            data_conclusao: new Date().toISOString(),
            concluida_por: user.id
          });

        if (historicoError) {
          console.error('Erro ao registrar histórico:', historicoError);
        }
      }
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

  // Pausar/reativar template
  const toggleTemplate = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase
        .from('tarefas_templates' as any)
        .update({ ativa, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-templates'] });
      toast({
        title: variables.ativa ? "Template ativado" : "Template pausado",
        description: variables.ativa 
          ? "A tarefa voltará a ser criada automaticamente."
          : "A tarefa não será mais criada automaticamente.",
      });
    },
  });

  // Deletar template
  const deletarTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefas_templates' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-templates'] });
      toast({
        title: "Template deletado",
        description: "A tarefa recorrente foi removida.",
      });
    },
  });

  return {
    tarefas,
    isLoading,
    templates,
    criarTarefa,
    criarTemplate,
    marcarConcluida,
    reabrirTarefa,
    deletarTarefa,
    toggleTemplate,
    deletarTemplate,
  };
}
