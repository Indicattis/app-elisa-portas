import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustoMensal {
  id: string;
  mes: string;
  tipo_custo_id: string;
  valor_real: number;
  observacoes: string | null;
  tipo_custo?: {
    id: string;
    nome: string;
    descricao: string | null;
    categoria_id: string | null;
    subcategoria_id: string | null;
    valor_maximo_mensal: number;
    tipo: string;
    ativo: boolean;
    categoria?: { id: string; nome: string; cor: string | null } | null;
    subcategoria?: { id: string; nome: string } | null;
  };
}

export interface TotalMes {
  mes: string;
  total_real: number;
  total_limite: number;
}

export const useCustosMensais = (mes?: string) => {
  const [custosMes, setCustosMes] = useState<CustoMensal[]>([]);
  const [totaisPorMes, setTotaisPorMes] = useState<TotalMes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCustosMes = useCallback(async (mesDate: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custos_mensais" as any)
      .select("*, tipo_custo:tipos_custos(*, categoria:custos_categorias(*), subcategoria:custos_subcategorias(*))")
      .eq("mes", mesDate);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar custos do mês");
    } else {
      setCustosMes((data || []) as unknown as CustoMensal[]);
    }
    setLoading(false);
  }, []);

  const fetchTotaisPorMes = useCallback(async (ano: number) => {
    setLoading(true);
    const startDate = `${ano}-01-01`;
    const endDate = `${ano}-12-01`;

    const { data, error } = await supabase
      .from("custos_mensais" as any)
      .select("mes, valor_real")
      .gte("mes", startDate)
      .lte("mes", endDate);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar totais");
      setLoading(false);
      return;
    }

    // Agrupa por mês
    const totais: Record<string, number> = {};
    ((data || []) as any[]).forEach((row: any) => {
      const m = row.mes;
      totais[m] = (totais[m] || 0) + Number(row.valor_real || 0);
    });

    // Busca limites dos tipos ativos
    const { data: tipos } = await supabase
      .from("tipos_custos" as any)
      .select("valor_maximo_mensal")
      .eq("ativo", true);

    const totalLimite = ((tipos || []) as any[]).reduce((acc: number, t: any) => acc + Number(t.valor_maximo_mensal || 0), 0);

    const result: TotalMes[] = [];
    for (let i = 1; i <= 12; i++) {
      const mesKey = `${ano}-${String(i).padStart(2, "0")}-01`;
      result.push({
        mes: mesKey,
        total_real: totais[mesKey] || 0,
        total_limite: totalLimite,
      });
    }

    setTotaisPorMes(result);
    setLoading(false);
  }, []);

  const saveCustoMensal = async (
    tipo_custo_id: string,
    mesDate: string,
    valor_real: number,
    observacoes?: string
  ) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from("custos_mensais" as any)
      .upsert(
        {
          mes: mesDate,
          tipo_custo_id,
          valor_real,
          observacoes: observacoes || null,
          created_by: userId,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "mes,tipo_custo_id" }
      );

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar custo");
      setSaving(false);
      return false;
    }

    setSaving(false);
    return true;
  };

  const saveCustosMensaisBatch = async (
    mesDate: string,
    custos: { tipo_custo_id: string; valor_real: number; observacoes?: string }[]
  ) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const rows = custos.map((c) => ({
      mes: mesDate,
      tipo_custo_id: c.tipo_custo_id,
      valor_real: c.valor_real,
      observacoes: c.observacoes || null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("custos_mensais" as any)
      .upsert(rows as any, { onConflict: "mes,tipo_custo_id" });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar custos");
      setSaving(false);
      return false;
    }

    toast.success("Custos salvos com sucesso!");
    setSaving(false);
    return true;
  };

  useEffect(() => {
    if (mes) {
      fetchCustosMes(mes);
    }
  }, [mes, fetchCustosMes]);

  return {
    custosMes,
    totaisPorMes,
    loading,
    saving,
    fetchCustosMes,
    fetchTotaisPorMes,
    saveCustoMensal,
    saveCustosMensaisBatch,
  };
};
