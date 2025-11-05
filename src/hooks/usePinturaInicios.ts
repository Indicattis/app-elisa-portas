import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePinturaInicios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

          return {
            ...inicio,
            admin_users: userData,
          };
        })
      );

      return iniciosComUsuarios;
    },
  });

  // Criar novo início de pintura
  const criarInicio = useMutation({
    mutationFn: async (observacoes?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from("pintura_inicios")
        .insert({
          iniciado_por: user.id,
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
  };
}
