
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/types/lead";

export function useOrcamentoData() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .order("data_envio", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    }
  };

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          elisaportas_leads (nome, telefone, email),
          admin_users!orcamentos_atendente_id_fkey (nome, foto_perfil_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar orçamentos",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchOrcamentos();
  }, []);

  return {
    leads,
    orcamentos,
    fetchLeads,
    fetchOrcamentos
  };
}
