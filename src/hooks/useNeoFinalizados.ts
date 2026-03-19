import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import type { NeoInstalacao } from "@/types/neoInstalacao";
import type { NeoCorrecao } from "@/types/neoCorrecao";

type NeoFinalizadoItem = (NeoInstalacao | NeoCorrecao) & {
  concluidor?: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
};

export const useNeoFinalizados = () => {
  const limite = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const { data: finalizados = [], isLoading } = useQuery({
    queryKey: ["neo_finalizados", limite],
    queryFn: async () => {
      const [instRes, corrRes] = await Promise.all([
        supabase
          .from("neo_instalacoes")
          .select("*")
          .eq("concluida", true)
          .gte("concluida_em", limite)
          .order("concluida_em", { ascending: false }),
        supabase
          .from("neo_correcoes")
          .select("*")
          .eq("concluida", true)
          .gte("concluida_em", limite)
          .order("concluida_em", { ascending: false }),
      ]);

      if (instRes.error) throw instRes.error;
      if (corrRes.error) throw corrRes.error;

      const instalacoes: NeoFinalizadoItem[] = (instRes.data || []).map((item: any) => ({
        ...item,
        _tipo: "neo_instalacao" as const,
      }));

      const correcoes: NeoFinalizadoItem[] = (corrRes.data || []).map((item: any) => ({
        ...item,
        _tipo: "neo_correcao" as const,
      }));

      const todos = [...instalacoes, ...correcoes].sort((a, b) => {
        const dateA = a.concluida_em ? new Date(a.concluida_em).getTime() : 0;
        const dateB = b.concluida_em ? new Date(b.concluida_em).getTime() : 0;
        return dateB - dateA;
      });

      // Fetch concluidor info
      const userIds = [...new Set(todos.map((t) => t.concluida_por).filter(Boolean))] as string[];

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("admin_users")
          .select("user_id, nome, foto_perfil_url")
          .in("user_id", userIds);

        const usersMap = new Map(
          (users || []).map((u) => [u.user_id, { id: u.user_id, nome: u.nome, foto_perfil_url: u.foto_perfil_url }])
        );

        todos.forEach((item) => {
          if (item.concluida_por) {
            item.concluidor = usersMap.get(item.concluida_por) || null;
          }
        });
      }

      return todos;
    },
  });

  return { finalizados, isLoading };
};
