import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Gasto {
  id: string;
  tipo_custo_id: string;
  descricao: string | null;
  valor: number;
  data: string;
  responsavel_id: string;
  status: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  tipo_custo_nome?: string;
  responsavel_nome?: string;
}

export const useGastos = (mesFiltro?: string) => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGastos = async () => {
    setLoading(true);

    let query = supabase
      .from("gastos" as any)
      .select("*")
      .order("data", { ascending: false });

    if (mesFiltro) {
      const start = `${mesFiltro}-01`;
      const [y, m] = mesFiltro.split("-").map(Number);
      const end = new Date(y, m, 0).toISOString().split("T")[0];
      query = query.gte("data", start).lte("data", end);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar gastos");
      console.error(error);
      setLoading(false);
      return;
    }

    const rows = (data || []) as unknown as Gasto[];

    // fetch tipo_custo names
    const tipoCustoIds = [...new Set(rows.map((r) => r.tipo_custo_id))];
    const responsavelIds = [...new Set(rows.map((r) => r.responsavel_id))];

    let tiposMap: Record<string, string> = {};
    let responsaveisMap: Record<string, string> = {};

    if (tipoCustoIds.length > 0) {
      const { data: tipos } = await supabase
        .from("tipos_custos" as any)
        .select("id, nome")
        .in("id", tipoCustoIds);
      (tipos || []).forEach((t: any) => {
        tiposMap[t.id] = t.nome;
      });
    }

    if (responsavelIds.length > 0) {
      const { data: users } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", responsavelIds);
      (users || []).forEach((u: any) => {
        responsaveisMap[u.user_id] = u.nome;
      });
    }

    const enriched = rows.map((r) => ({
      ...r,
      tipo_custo_nome: tiposMap[r.tipo_custo_id] || "—",
      responsavel_nome: responsaveisMap[r.responsavel_id] || "—",
    }));

    setGastos(enriched);
    setLoading(false);
  };

  const saveGasto = async (data: Partial<Gasto>) => {
    try {
      const { error } = await supabase
        .from("gastos" as any)
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }] as any);
      if (error) throw error;
      toast.success("Gasto registrado com sucesso!");
      await fetchGastos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar gasto");
      console.error(error);
      return false;
    }
  };

  const updateGasto = async (id: string, data: Partial<Gasto>) => {
    try {
      const { error } = await supabase
        .from("gastos" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Gasto atualizado!");
      await fetchGastos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar gasto");
      console.error(error);
      return false;
    }
  };

  const deleteGasto = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gastos" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Gasto excluído!");
      await fetchGastos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir gasto");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    fetchGastos();
  }, [mesFiltro]);

  return { gastos, loading, refetch: fetchGastos, saveGasto, updateGasto, deleteGasto };
};
