import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface DRE {
  id: string;
  mes: string;
  faturamento_total: number;
  custos_producao: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  resultado_final: number;
  total_vendas: number;
  vendas_faturadas: number;
  observacoes: string | null;
}

export interface ValidacaoMes {
  podeGerar: boolean;
  totalVendas: number;
  vendasFaturadas: number;
  despesasFixasPreenchidas: boolean;
  despesasVariaveisPreenchidas: boolean;
  motivos: string[];
}

export const useDRE = () => {
  const [dres, setDres] = useState<DRE[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDREs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dre_mensais")
        .select("*")
        .order("mes", { ascending: false });

      if (error) throw error;
      setDres(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar DREs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validarMesParaDRE = async (mes: string): Promise<ValidacaoMes> => {
    const motivos: string[] = [];
    
    try {
      const startDate = format(startOfMonth(new Date(mes)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(mes)), "yyyy-MM-dd");

      // 1. Verificar vendas do mês
      const { data: vendas, error: vendasError } = await supabase
        .from("vendas")
        .select(`
          id,
          frete_aprovado,
          custo_total,
          produtos_vendas (faturamento)
        `)
        .gte("data_venda", startDate + " 00:00:00")
        .lte("data_venda", endDate + " 23:59:59");

      if (vendasError) throw vendasError;

      const totalVendas = vendas?.length || 0;
      
      // Verificar se todas as vendas estão faturadas
      const vendasFaturadas = vendas?.filter(venda => {
        const freteAprovado = venda.frete_aprovado === true;
        const temCustoTotal = (venda.custo_total || 0) > 0;
        const produtosFaturados = (venda.produtos_vendas || []).every(
          (p: any) => p.faturamento === true
        );
        return freteAprovado && temCustoTotal && produtosFaturados;
      }).length || 0;

      if (totalVendas === 0) {
        motivos.push("Não há vendas cadastradas para este mês");
      } else if (vendasFaturadas < totalVendas) {
        motivos.push(`${totalVendas - vendasFaturadas} vendas ainda não foram faturadas`);
      }

      // 2. Verificar despesas fixas
      const { data: despesasFixas, error: fixasError } = await supabase
        .from("despesas_mensais")
        .select("valor_real")
        .eq("mes", mes)
        .eq("modalidade", "fixa");

      if (fixasError) throw fixasError;

      const despesasFixasPreenchidas = (despesasFixas?.length || 0) > 0 && 
        despesasFixas?.every(d => d.valor_real > 0);

      if (!despesasFixasPreenchidas) {
        motivos.push("Despesas fixas não estão preenchidas para este mês");
      }

      // 3. Verificar despesas variáveis
      const { data: despesasVariaveis, error: variaveisError } = await supabase
        .from("despesas_mensais")
        .select("valor_real")
        .eq("mes", mes)
        .eq("modalidade", "projetada");

      if (variaveisError) throw variaveisError;

      const despesasVariaveisPreenchidas = (despesasVariaveis?.length || 0) > 0 && 
        despesasVariaveis?.every(d => d.valor_real > 0);

      if (!despesasVariaveisPreenchidas) {
        motivos.push("Despesas variáveis não estão preenchidas para este mês");
      }

      const podeGerar = totalVendas > 0 && 
                        vendasFaturadas === totalVendas && 
                        despesasFixasPreenchidas && 
                        despesasVariaveisPreenchidas;

      return {
        podeGerar,
        totalVendas,
        vendasFaturadas,
        despesasFixasPreenchidas,
        despesasVariaveisPreenchidas,
        motivos,
      };
    } catch (error) {
      console.error("Erro ao validar mês:", error);
      return {
        podeGerar: false,
        totalVendas: 0,
        vendasFaturadas: 0,
        despesasFixasPreenchidas: false,
        despesasVariaveisPreenchidas: false,
        motivos: ["Erro ao validar mês"],
      };
    }
  };

  const gerarDRE = async (mes: string, observacoes?: string) => {
    try {
      // Validar primeiro
      const validacao = await validarMesParaDRE(mes);
      if (!validacao.podeGerar) {
        toast.error("Não é possível gerar DRE: " + validacao.motivos.join(", "));
        return false;
      }

      const startDate = format(startOfMonth(new Date(mes)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(mes)), "yyyy-MM-dd");

      // Buscar dados de vendas faturadas
      const { data: vendas, error: vendasError } = await supabase
        .from("vendas")
        .select("valor_venda, lucro_total, valor_frete")
        .gte("data_venda", startDate + " 00:00:00")
        .lte("data_venda", endDate + " 23:59:59");

      if (vendasError) throw vendasError;

      const faturamentoTotal = vendas?.reduce((acc, v) => 
        acc + ((v.valor_venda || 0) - (v.valor_frete || 0)), 0) || 0;
      
      const lucroTotal = vendas?.reduce((acc, v) => 
        acc + (v.lucro_total || 0), 0) || 0;

      const custosProducao = faturamentoTotal - lucroTotal;

      // Buscar despesas
      const { data: despesas, error: despesasError } = await supabase
        .from("despesas_mensais")
        .select("modalidade, valor_real")
        .eq("mes", mes);

      if (despesasError) throw despesasError;

      const despesasFixas = despesas
        ?.filter(d => d.modalidade === 'fixa')
        .reduce((acc, d) => acc + (d.valor_real || 0), 0) || 0;

      const despesasVariaveis = despesas
        ?.filter(d => d.modalidade === 'projetada')
        .reduce((acc, d) => acc + (d.valor_real || 0), 0) || 0;

      const resultadoFinal = lucroTotal - despesasFixas - despesasVariaveis;

      // Inserir DRE
      const { error: insertError } = await supabase
        .from("dre_mensais")
        .insert([{
          mes,
          faturamento_total: faturamentoTotal,
          custos_producao: custosProducao,
          despesas_fixas: despesasFixas,
          despesas_variaveis: despesasVariaveis,
          resultado_final: resultadoFinal,
          total_vendas: validacao.totalVendas,
          vendas_faturadas: validacao.vendasFaturadas,
          observacoes: observacoes || null,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }]);

      if (insertError) throw insertError;

      toast.success("D.R.E gerado com sucesso!");
      await fetchDREs();
      return true;
    } catch (error: any) {
      toast.error("Erro ao gerar DRE");
      console.error(error);
      return false;
    }
  };

  const deleteDRE = async (id: string) => {
    try {
      const { error } = await supabase
        .from("dre_mensais")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("D.R.E excluído com sucesso!");
      await fetchDREs();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir DRE");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    fetchDREs();
  }, []);

  return {
    dres,
    loading,
    gerarDRE,
    deleteDRE,
    validarMesParaDRE,
    refetch: fetchDREs,
  };
};
