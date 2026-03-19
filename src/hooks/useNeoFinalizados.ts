import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinalizadoItem {
  id: string;
  nome_cliente: string;
  cidade: string | null;
  estado: string | null;
  concluida_em: string | null;
  concluida_por: string | null;
  equipe_nome: string | null;
  _tipo: "neo_instalacao" | "neo_correcao" | "instalacao";
  concluidor?: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
}

export const useNeoFinalizados = () => {
  const { data: finalizados = [], isLoading } = useQuery({
    queryKey: ["finalizados_todos"],
    queryFn: async () => {
      const [neoInstRes, neoCorrRes, instRes] = await Promise.all([
        supabase
          .from("neo_instalacoes")
          .select("id, nome_cliente, cidade, estado, concluida_em, concluida_por, equipe_nome")
          .eq("concluida", true)
          .order("concluida_em", { ascending: false }),
        supabase
          .from("neo_correcoes")
          .select("id, nome_cliente, cidade, estado, concluida_em, concluida_por, equipe_nome")
          .eq("concluida", true)
          .order("concluida_em", { ascending: false }),
        supabase
          .from("instalacoes")
          .select("id, nome_cliente, cidade, estado, instalacao_concluida_em, instalacao_concluida_por, responsavel_instalacao_id")
          .eq("instalacao_concluida", true)
          .order("instalacao_concluida_em", { ascending: false }),
      ]);

      if (neoInstRes.error) throw neoInstRes.error;
      if (neoCorrRes.error) throw neoCorrRes.error;
      if (instRes.error) throw instRes.error;

      const neoInstalacoes: FinalizadoItem[] = (neoInstRes.data || []).map((item: any) => ({
        id: item.id,
        nome_cliente: item.nome_cliente,
        cidade: item.cidade,
        estado: item.estado,
        concluida_em: item.concluida_em,
        concluida_por: item.concluida_por,
        equipe_nome: item.equipe_nome || null,
        _tipo: "neo_instalacao" as const,
      }));

      const neoCorrecoes: FinalizadoItem[] = (neoCorrRes.data || []).map((item: any) => ({
        id: item.id,
        nome_cliente: item.nome_cliente,
        cidade: item.cidade,
        estado: item.estado,
        concluida_em: item.concluida_em,
        concluida_por: item.concluida_por,
        equipe_nome: item.equipe_nome || null,
        _tipo: "neo_correcao" as const,
      }));

      const instalacoes: FinalizadoItem[] = (instRes.data || []).map((item: any) => ({
        id: item.id,
        nome_cliente: item.nome_cliente,
        cidade: item.cidade,
        estado: item.estado,
        concluida_em: item.instalacao_concluida_em,
        concluida_por: item.instalacao_concluida_por,
        equipe_nome: item.responsavel_instalacao_nome || null,
        _tipo: "instalacao" as const,
      }));

      const todos = [...neoInstalacoes, ...neoCorrecoes, ...instalacoes].sort((a, b) => {
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
