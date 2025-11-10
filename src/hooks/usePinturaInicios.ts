import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";

export function usePinturaInicios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: producaoUser } = useProducaoAuth();

  // Buscar inícios de pintura
  const { data: inicios = [], isLoading } = useQuery({
    queryKey: ["pintura-inicios"],
    queryFn: async () => {
      const { data: iniciosData, error } = await supabase
        .from("pintura_inicios")
        .select("*")
        .order('iniciado_em', { ascending: false });

      if (error) throw error;
      if (!iniciosData) return [];

      // Buscar dados dos usuários
      const iniciosComUsuarios = await Promise.all(
        iniciosData.map(async (inicio) => {
          const { data: userData } = await supabase
            .from("admin_users")
            .select("id, nome, foto_perfil_url")
            .eq("user_id", inicio.iniciado_por)
            .maybeSingle();

          let recargaUserData = null;
          if (inicio.recarga_realizada_por) {
            const { data } = await supabase
              .from("admin_users")
              .select("id, nome, foto_perfil_url")
              .eq("user_id", inicio.recarga_realizada_por)
              .maybeSingle();
            recargaUserData = data;
          }

          return {
            ...inicio,
            admin_users: userData,
            recarga_admin_users: recargaUserData,
          };
        })
      );

      return iniciosComUsuarios;
    },
  });

  // Alternar status de recarga (apenas permitir marcar como true, não desmarcar)
  const toggleRecarga = useMutation({
    mutationFn: async (inicioId: string) => {
      if (!producaoUser) throw new Error('Usuário não autenticado');

      // Buscar o estado atual
      const { data: inicioAtual } = await supabase
        .from('pintura_inicios')
        .select('recarga_realizada')
        .eq('id', inicioId)
        .single();

      // Não permitir edição se já foi feita a recarga
      if (inicioAtual?.recarga_realizada) {
        throw new Error('Recarga já foi realizada e não pode ser alterada');
      }

      const { error } = await supabase
        .from('pintura_inicios')
        .update({
          recarga_realizada: true,
          recarga_realizada_em: new Date().toISOString(),
          recarga_realizada_por: producaoUser.user_id,
        })
        .eq('id', inicioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pintura-inicios'] });
      toast({
        title: "Recarga registrada",
        description: "Recarga da fornada registrada com sucesso",
      });
    },
    onError: (error) => {
      console.error('Erro ao registrar recarga:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível registrar a recarga",
        variant: "destructive",
      });
    },
  });

  // Criar novo início de pintura
  const criarInicio = useMutation({
    mutationFn: async (observacoes?: string) => {
      if (!producaoUser) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from("pintura_inicios")
        .insert({
          iniciado_por: producaoUser.user_id,
          observacoes: observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pintura-inicios"] });
      toast({
        title: "Início de pintura registrado",
        description: "O forno foi iniciado com sucesso",
      });
    },
    onError: (error) => {
      console.error("Erro ao registrar início:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o início de pintura",
        variant: "destructive",
      });
    },
  });

  return {
    inicios,
    isLoading,
    criarInicio,
    toggleRecarga,
  };
}
