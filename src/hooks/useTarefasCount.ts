import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, endOfWeek, formatISO } from "date-fns";

export function useTarefasCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tarefas-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const now = new Date();
      const weekStart = formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
      const weekEnd = formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });

      const { count, error } = await supabase
        .from("tarefas")
        .select("*", { count: "exact", head: true })
        .eq("responsavel_id", user.id)
        .eq("status", "em_andamento")
        .gte("data_referencia", weekStart)
        .lte("data_referencia", weekEnd);

      if (error) {
        console.error("Erro ao buscar contador de tarefas:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}
