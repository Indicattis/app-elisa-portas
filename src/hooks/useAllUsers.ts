import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  foto_perfil_url?: string;
  cpf?: string;
  ativo: boolean;
  em_teste?: boolean;
  salario?: number | null;
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const query = supabase
        .from("admin_users")
        .select("*")
        .eq("ativo", true)
        .eq("tipo_usuario", "colaborador");

      // Filter by visivel_organograma (column added via migration, not yet in generated types)
      const { data, error } = await (query as any).eq("visivel_organograma", true).order("nome");

      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }

      return (data || []) as User[];
    },
  });
}
