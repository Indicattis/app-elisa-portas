
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lead } from "@/types/lead";

interface OrcamentoInfo {
  leadId: string;
  hasOrcamento: boolean;
  status: string | null;
  count: number;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [atendentes, setAtendentes] = useState<Map<string, string>>(new Map());
  const [leadsWithApprovedBudgets, setLeadsWithApprovedBudgets] = useState<Set<string>>(new Set());
  const [orcamentosInfo, setOrcamentosInfo] = useState<Map<string, OrcamentoInfo>>(new Map());
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

      // Buscar leads com orçamentos aprovados
      const leadIds = data?.map(lead => lead.id) || [];
      if (leadIds.length > 0) {
        const { data: orcamentosData, error: orcamentosError } = await supabase
          .from("orcamentos")
          .select("lead_id")
          .in("lead_id", leadIds)
          .eq("status", "aprovado");

        if (!orcamentosError && orcamentosData) {
          const leadsWithBudgets = new Set(orcamentosData.map(o => o.lead_id));
          setLeadsWithApprovedBudgets(leadsWithBudgets);
        }

        // Buscar informações completas dos orçamentos
        const { data: allOrcamentosData, error: allOrcamentosError } = await supabase
          .from("orcamentos")
          .select("lead_id, status")
          .in("lead_id", leadIds);

        if (!allOrcamentosError && allOrcamentosData) {
          const orcamentosMap = new Map<string, OrcamentoInfo>();
          
          // Agrupar orçamentos por lead
          const orcamentosPorLead = allOrcamentosData.reduce((acc, orcamento) => {
            if (!acc[orcamento.lead_id]) {
              acc[orcamento.lead_id] = [];
            }
            acc[orcamento.lead_id].push(orcamento.status);
            return acc;
          }, {} as Record<string, string[]>);

          // Criar informações de orçamento para cada lead
          Object.entries(orcamentosPorLead).forEach(([leadId, statuses]) => {
            // Priorizar status: aprovado > pendente > outros
            let status = statuses[0];
            if (statuses.includes('aprovado')) {
              status = 'aprovado';
            } else if (statuses.includes('pendente')) {
              status = 'pendente';
            }

            orcamentosMap.set(leadId, {
              leadId,
              hasOrcamento: true,
              status,
              count: statuses.length
            });
          });

          // Adicionar leads sem orçamentos
          leadIds.forEach(leadId => {
            if (!orcamentosMap.has(leadId)) {
              orcamentosMap.set(leadId, {
                leadId,
                hasOrcamento: false,
                status: null,
                count: 0
              });
            }
          });

          setOrcamentosInfo(orcamentosMap);
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
        description: "Lead capturado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao capturar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao capturar lead",
      });
    }
  };

  const handleMarkAsLost = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 7, // Status perdido
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "marcou_como_perdido",
        status_anterior: 4,
        status_novo: 7,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Lead marcado como perdido",
      });
    } catch (error) {
      console.error("Erro ao marcar lead como perdido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao marcar lead como perdido",
      });
    }
  };

  const handleMarkAsDisqualified = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 6, // Status desqualificado
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "desqualificou_lead",
        status_anterior: 2,
        status_novo: 6,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Lead desqualificado",
      });
    } catch (error) {
      console.error("Erro ao desqualificar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao desqualificar lead",
      });
    }
  };

  const handleCancelAttendance = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 1, // Volta para aguardando atendente
          atendente_id: null,
          data_inicio_atendimento: null,
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "cancelou_atendimento",
        status_anterior: 2,
        status_novo: 1,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Atendimento cancelado",
      });
    } catch (error) {
      console.error("Erro ao cancelar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar atendimento",
      });
    }
  };

  const handleMarkAsSold = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 4, // Aguardando aprovação
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "solicitou_aprovacao_venda",
        status_anterior: 2,
        status_novo: 4,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Solicitação de venda enviada para aprovação",
      });
    } catch (error) {
      console.error("Erro ao solicitar aprovação de venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao solicitar aprovação de venda",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    atendentes,
    leadsWithApprovedBudgets,
    orcamentosInfo,
    loading,
    fetchLeads,
    handleStartAttendance,
    handleMarkAsLost,
    handleMarkAsDisqualified,
    handleCancelAttendance,
    handleMarkAsSold,
  };
}
