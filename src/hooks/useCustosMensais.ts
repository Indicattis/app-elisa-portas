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

  // Fetch custos do mês lendo de despesas_mensais e mapeando por nome aos tipos_custos
  const fetchCustosMes = useCallback(async (mesDate: string) => {
    setLoading(true);

    // Busca despesas do mês (fixas e variáveis/projetadas)
    const { data: despesas, error: errDesp } = await supabase
      .from("despesas_mensais")
      .select("*")
      .eq("mes", mesDate)
      .in("modalidade", ["fixa", "projetada", "variavel_nao_esperada"]);

    if (errDesp) {
      console.error(errDesp);
      toast.error("Erro ao carregar custos do mês");
      setLoading(false);
      return;
    }

    // Busca tipos_custos para mapear por nome
    const { data: tipos } = await supabase
      .from("tipos_custos" as any)
      .select("id, nome, descricao, valor_maximo_mensal, tipo, ativo");

    const tiposMap = new Map<string, any>();
    ((tipos || []) as any[]).forEach((t: any) => {
      tiposMap.set(t.nome.toLowerCase().trim(), t);
    });

    // Mapeia despesas_mensais → CustoMensal, vinculando ao tipo_custo pelo nome
    const result: CustoMensal[] = ((despesas || []) as any[]).map((d: any) => {
      const tipoCusto = tiposMap.get(d.nome.toLowerCase().trim());
      return {
        id: d.id,
        mes: d.mes,
        tipo_custo_id: tipoCusto?.id || "",
        valor_real: Number(d.valor_real) || 0,
        observacoes: d.observacoes || null,
        tipo_custo: tipoCusto ? {
          id: tipoCusto.id,
          nome: tipoCusto.nome,
          descricao: tipoCusto.descricao,
          categoria_id: null,
          subcategoria_id: null,
          valor_maximo_mensal: tipoCusto.valor_maximo_mensal,
          tipo: tipoCusto.tipo,
          ativo: tipoCusto.ativo,
        } : undefined,
      };
    });

    setCustosMes(result);
    setLoading(false);
  }, []);

  const fetchTotaisPorMes = useCallback(async (ano: number) => {
    setLoading(true);
    const startDate = `${ano}-01-01`;
    const endDate = `${ano}-12-01`;

    // Busca de despesas_mensais
    const { data, error } = await supabase
      .from("despesas_mensais")
      .select("mes, valor_real")
      .gte("mes", startDate)
      .lte("mes", endDate)
      .in("modalidade", ["fixa", "projetada", "variavel_nao_esperada"]);

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

  // Salva em despesas_mensais fazendo upsert por mes+nome
  const saveCustosMensaisBatch = async (
    mesDate: string,
    custos: { tipo_custo_id: string; valor_real: number; observacoes?: string }[],
    tiposCustosRef?: { id: string; nome: string; tipo: string }[]
  ) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Se não recebeu referência, busca tipos_custos
    let tiposMap = new Map<string, any>();
    if (tiposCustosRef) {
      tiposCustosRef.forEach(t => tiposMap.set(t.id, t));
    } else {
      const { data: tipos } = await supabase
        .from("tipos_custos" as any)
        .select("id, nome, tipo");
      ((tipos || []) as any[]).forEach((t: any) => tiposMap.set(t.id, t));
    }

    // Para cada custo, faz upsert individual em despesas_mensais
    for (const c of custos) {
      const tipo = tiposMap.get(c.tipo_custo_id);
      if (!tipo) continue;

      const modalidade = tipo.tipo === "fixa" ? "fixa" : "projetada";
      const categoria = tipo.tipo === "fixa" ? "Despesas fixas" : "Despesas variáveis";

      // Verifica se já existe registro com mesmo mes + nome
      const { data: existing } = await supabase
        .from("despesas_mensais")
        .select("id")
        .eq("mes", mesDate)
        .eq("nome", tipo.nome)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("despesas_mensais")
          .update({
            valor_real: c.valor_real,
            observacoes: c.observacoes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.error(error);
          toast.error(`Erro ao salvar ${tipo.nome}`);
          setSaving(false);
          return false;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from("despesas_mensais")
          .insert({
            mes: mesDate,
            nome: tipo.nome,
            modalidade,
            categoria,
            valor_real: c.valor_real,
            valor_esperado: 0,
            observacoes: c.observacoes || null,
            tipo_status: "decretada",
            created_by: userId,
          });

        if (error) {
          console.error(error);
          toast.error(`Erro ao salvar ${tipo.nome}`);
          setSaving(false);
          return false;
        }
      }
    }

    toast.success("Custos salvos com sucesso!");
    setSaving(false);
    return true;
  };

  // Keep legacy single save (redirects to batch)
  const saveCustoMensal = async (
    tipo_custo_id: string,
    mesDate: string,
    valor_real: number,
    observacoes?: string
  ) => {
    return saveCustosMensaisBatch(mesDate, [{ tipo_custo_id, valor_real, observacoes }]);
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
