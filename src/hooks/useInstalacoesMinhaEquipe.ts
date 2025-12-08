import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InstalacaoCalendario } from "./useOrdensInstalacaoCalendario";

export const useInstalacoesMinhaEquipe = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["instalacoes_minha_equipe", user?.id],
    queryFn: async () => {
      if (!user?.id) return { instalacoes: [], equipe: null };

      // Buscar a equipe do usuário (via membros ou como responsável)
      const { data: membroEquipe } = await supabase
        .from("equipes_instalacao_membros")
        .select("equipe_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: equipeResponsavel } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("responsavel_id", user.id)
        .eq("ativa", true)
        .maybeSingle();

      const equipeId = membroEquipe?.equipe_id || equipeResponsavel?.id;

      if (!equipeId) {
        return { instalacoes: [], equipe: null };
      }

      // Buscar dados da equipe
      const { data: equipe } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("id", equipeId)
        .single();

      // Buscar instalações pendentes da equipe
      const { data: instalacoes, error } = await supabase
        .from("instalacoes")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro
          )
        `)
        .eq("responsavel_instalacao_id", equipeId)
        .eq("instalacao_concluida", false)
        .not("data_instalacao", "is", null)
        .order("data_instalacao", { ascending: true });

      if (error) {
        console.error("Erro ao buscar instalações da equipe:", error);
        throw error;
      }

      return {
        instalacoes: (instalacoes || []).map(item => ({
          ...item,
          equipe,
          _corEquipe: equipe?.cor || null
        })) as InstalacaoCalendario[],
        equipe
      };
    },
    enabled: !!user?.id,
  });
};
