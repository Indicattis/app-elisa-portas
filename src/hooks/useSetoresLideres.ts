import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SetorLider {
  id: string;
  setor: string;
  lider_id: string;
  atribuido_por: string;
  created_at: string;
  updated_at: string;
  lider?: {
    user_id: string;
    nome: string;
    email: string;
    role: string;
    foto_perfil_url: string | null;
  };
}

export function useSetoresLideres() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar todos os líderes de setor
  const { data: lideres = [], isLoading } = useQuery({
    queryKey: ['setores-lideres'],
    queryFn: async () => {
      // Buscar setores_lideres
      const { data: setores, error: setoresError } = await supabase
        .from('setores_lideres')
        .select('*')
        .order('setor');

      if (setoresError) throw setoresError;
      if (!setores || setores.length === 0) return [];

      // Buscar informações dos líderes
      const liderIds = setores.map(s => s.lider_id);
      const { data: usuarios, error: usuariosError } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, role, foto_perfil_url')
        .in('user_id', liderIds);

      if (usuariosError) throw usuariosError;

      // Combinar os dados
      return setores.map(setor => ({
        ...setor,
        lider: usuarios?.find(u => u.user_id === setor.lider_id)
      })) as SetorLider[];
    },
  });

  // Atribuir ou atualizar líder
  const atribuirLider = useMutation({
    mutationFn: async ({ setor, lider_id }: { setor: string; lider_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('setores_lideres')
        .upsert(
          { 
            setor, 
            lider_id,
            atribuido_por: user.id
          },
          { onConflict: 'setor' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores-lideres'] });
      queryClient.invalidateQueries({ queryKey: ['setor-info'] });
      toast({
        title: "Líder atribuído",
        description: "O líder do setor foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atribuir líder",
        description: error.message,
      });
    },
  });

  // Remover líder atribuído (volta ao comportamento automático)
  const removerLider = useMutation({
    mutationFn: async (setor: string) => {
      const { error } = await supabase
        .from('setores_lideres')
        .delete()
        .eq('setor', setor);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores-lideres'] });
      queryClient.invalidateQueries({ queryKey: ['setor-info'] });
      toast({
        title: "Líder removido",
        description: "A atribuição manual foi removida. O sistema usará o gerente padrão.",
      });
    },
  });

  return {
    lideres,
    isLoading,
    atribuirLider,
    removerLider,
  };
}
