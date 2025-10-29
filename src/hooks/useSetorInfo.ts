import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRolesFromSetor } from "@/utils/setorMapping";

export function useSetorInfo(setor?: string) {
  return useQuery({
    queryKey: ['setor-info', setor],
    queryFn: async () => {
      if (!setor) return null;

      // PRIORIDADE 1: Buscar líder atribuído manualmente
      const { data: liderAtribuido, error: liderError } = await supabase
        .from('setores_lideres')
        .select('lider_id')
        .eq('setor', setor)
        .maybeSingle();

      if (liderAtribuido) {
        // Buscar dados completos do líder
        const { data: liderData, error: liderDataError } = await supabase
          .from('admin_users')
          .select('user_id, nome, email, role, foto_perfil_url')
          .eq('user_id', liderAtribuido.lider_id)
          .maybeSingle();

        if (liderData) {
          return liderData;
        }
      }

      // PRIORIDADE 2: Fallback para o primeiro gerente ativo (comportamento atual)
      const roles = getRolesFromSetor(setor);
      if (roles.length === 0) return null;

      const gerenteRoles = roles.filter(r => r.startsWith('gerente_'));
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, role, foto_perfil_url')
        .in('role', gerenteRoles.length > 0 ? gerenteRoles : roles)
        .eq('ativo', true)
        .order('role')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!setor,
  });
}
