import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRolesFromSetor } from "@/utils/setorMapping";

export function useSetorInfo(setor?: string) {
  return useQuery({
    queryKey: ['setor-info', setor],
    queryFn: async () => {
      if (!setor) return null;

      const roles = getRolesFromSetor(setor);
      if (roles.length === 0) return null;

      // Buscar o gerente/responsável do setor (primeiro gerente ativo)
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
