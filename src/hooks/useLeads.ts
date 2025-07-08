import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lead } from "@/types/lead";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [atendentes, setAtendentes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .order("data_envio", { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(data?.filter(lead => lead.atendente_id).map(lead => lead.atendente_id))];
      if (atendenteIds.length > 0) {
        const { data: atendenteData, error: atendenteError } = await supabase
          .from("admin_users")
          .select("user_id, nome")
          .in("user_id", atendenteIds);

        if (!atendenteError && atendenteData) {
          const atendenteMap = new Map();
          atendenteData.forEach((atendente: any) => {
            atendenteMap.set(atendente.user_id, atendente.nome);
          });
          setAtendentes(atendenteMap);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttendance = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 2,
          atendente_id: user?.id,
          data_inicio_atendimento: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "iniciou_atendimento",
        status_anterior: 1,
        status_novo: 2,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Atendimento iniciado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao iniciar atendimento",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    atendentes,
    loading,
    fetchLeads,
    handleStartAttendance,
  };
}