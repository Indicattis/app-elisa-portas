import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lead } from "@/types/lead";

interface OrcamentoFormData {
  lead_id: string;
  valor_produto: string;
  valor_pintura: string;
  valor_frete: string;
  valor_instalacao: string;
  campos_personalizados: { [key: string]: number };
  forma_pagamento: string;
  desconto_percentual: number;
  requer_analise: boolean;
  motivo_analise: string;
}

interface Filters {
  search: string;
  status: string;
  lead: string;
}

export function useOrcamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    lead: ""
  });

  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: "",
    valor_produto: "",
    valor_pintura: "0",
    valor_frete: "0",
    valor_instalacao: "0",
    campos_personalizados: {},
    forma_pagamento: "",
    desconto_percentual: 0,
    requer_analise: false,
    motivo_analise: ""
  });

  const [camposPersonalizados, setCamposPersonalizados] = useState<Array<{ nome: string; valor: string }>>([]);

  useEffect(() => {
    fetchLeads();
    fetchOrcamentos();
  }, []);

  useEffect(() => {
    filterOrcamentos();
  }, [orcamentos, filters]);

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
          elisaportas_leads (nome, telefone, email)
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

  const filterOrcamentos = () => {
    let filtered = orcamentos;

    if (filters.search) {
      filtered = filtered.filter(orc => 
        orc.elisaportas_leads?.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        orc.elisaportas_leads?.telefone.includes(filters.search)
      );
    }

    if (filters.status && filters.status !== "todos") {
      filtered = filtered.filter(orc => orc.status === filters.status);
    }

    if (filters.lead && filters.lead !== "todos") {
      filtered = filtered.filter(orc => orc.lead_id === filters.lead);
    }

    setFilteredOrcamentos(filtered);
  };

  const resetForm = () => {
    setFormData({
      lead_id: "",
      valor_produto: "",
      valor_pintura: "0",
      valor_frete: "0",
      valor_instalacao: "0",
      campos_personalizados: {},
      forma_pagamento: "",
      desconto_percentual: 0,
      requer_analise: false,
      motivo_analise: ""
    });
    setCamposPersonalizados([]);
  };

  const createOrcamento = async (valorTotal: number) => {
    setLoading(true);

    try {
      // Validar motivo da análise se necessário
      if (formData.requer_analise && !formData.motivo_analise.trim()) {
        throw new Error("Motivo da análise é obrigatório quando necessário");
      }

      const camposPersonalizadosObj = camposPersonalizados.reduce((acc, campo) => {
        if (campo.nome && campo.valor) {
          acc[campo.nome] = parseFloat(campo.valor);
        }
        return acc;
      }, {} as { [key: string]: number });

      const orcamentoData = {
        lead_id: formData.lead_id,
        usuario_id: user?.id,
        valor_produto: parseFloat(formData.valor_produto),
        valor_pintura: parseFloat(formData.valor_pintura),
        valor_frete: parseFloat(formData.valor_frete),
        valor_instalacao: parseFloat(formData.valor_instalacao),
        campos_personalizados: camposPersonalizadosObj,
        forma_pagamento: formData.forma_pagamento,
        desconto_percentual: formData.desconto_percentual,
        valor_total: valorTotal,
        requer_analise: formData.requer_analise,
        motivo_analise: formData.requer_analise ? formData.motivo_analise : null,
        status: formData.requer_analise ? 'pendente' : 'aprovado'
      };

      const { data, error } = await supabase
        .from("orcamentos")
        .insert(orcamentoData)
        .select()
        .single();

      if (error) throw error;

      // Só atualizar valor do orçamento no lead se for aprovado automaticamente
      if (!formData.requer_analise) {
        await supabase
          .from("elisaportas_leads")
          .update({ valor_orcamento: valorTotal })
          .eq("id", formData.lead_id);
      }

      toast({
        title: "Sucesso",
        description: `Orçamento ${formData.requer_analise ? 'criado e enviado para análise' : 'criado e aprovado automaticamente'}`,
      });

      resetForm();
      fetchOrcamentos();

      return data;
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar orçamento",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const approveOrcamento = async (orcamentoId: string, desconto_adicional: number, tipo_desconto: string, observacoes: string) => {
    try {
      const { error } = await supabase.rpc("aprovar_orcamento", {
        orcamento_uuid: orcamentoId,
        desconto_adicional,
        tipo_desconto,
        observacoes: observacoes || null
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aprovar orçamento",
      });
      throw error;
    }
  };

  const rejectOrcamento = async (orcamentoId: string) => {
    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: 'reprovado' })
        .eq("id", orcamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento reprovado",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao reprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao reprovar orçamento",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchOrcamentos();
  }, []);

  useEffect(() => {
    filterOrcamentos();
  }, [orcamentos, filters]);

  return {
    leads,
    orcamentos,
    filteredOrcamentos,
    loading,
    filters,
    setFilters,
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    createOrcamento,
    approveOrcamento,
    rejectOrcamento,
    resetForm,
    fetchOrcamentos
  };
}
