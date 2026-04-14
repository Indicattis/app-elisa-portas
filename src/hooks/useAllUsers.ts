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
  custo_colaborador?: number | null;
  ordem?: number;
  setor?: string | null;
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("ativo", true)
        .eq("tipo_usuario", "colaborador")
        .eq("visivel_organograma", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }

      return (data || []) as User[];
    },
  });
}
