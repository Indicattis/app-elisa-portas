import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Investment {
  id: string;
  mes: string;
  regiao: string | null;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
  observacoes: string | null;
}

export interface InvestmentFormData {
  mes: string;
  regiao: string | null;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
  observacoes: string;
}

export const useInvestments = (year: number) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", startDate)
        .lte("mes", endDate)
        .order("mes", { ascending: true });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar investimentos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveInvestment = async (data: InvestmentFormData) => {
    try {
      // Check if investment exists for this month and region
      const { data: existing } = await supabase
        .from("marketing_investimentos")
        .select("id")
        .eq("mes", data.mes)
        .eq("regiao", data.regiao)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("marketing_investimentos")
          .update({
            investimento_google_ads: data.investimento_google_ads,
            investimento_meta_ads: data.investimento_meta_ads,
            investimento_linkedin_ads: data.investimento_linkedin_ads,
            outros_investimentos: data.outros_investimentos,
            observacoes: data.observacoes || null,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("marketing_investimentos")
          .insert([{
            mes: data.mes,
            regiao: data.regiao,
            investimento_google_ads: data.investimento_google_ads,
            investimento_meta_ads: data.investimento_meta_ads,
            investimento_linkedin_ads: data.investimento_linkedin_ads,
            outros_investimentos: data.outros_investimentos,
            observacoes: data.observacoes || null,
            created_by: (await supabase.auth.getUser()).data.user?.id || "",
          }]);

        if (error) throw error;
      }

      toast.success("Investimento salvo com sucesso!");
      await fetchInvestments();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar investimento");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [year]);

  return {
    investments,
    loading,
    saveInvestment,
    refetch: fetchInvestments,
  };
};
