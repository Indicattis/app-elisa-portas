import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useTarefasCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tarefas-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("tarefas")
        .select("*", { count: "exact", head: true })
        .eq("responsavel_id", user.id)
        .eq("status", "em_andamento");

      if (error) {
        console.error("Erro ao buscar contador de tarefas:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}
