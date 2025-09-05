
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
        .select(`
          id, nome, telefone, email, data_envio, novo_status, 
          atendente_id, canal_aquisicao_id, cidade, tag_id,
          motivo_perda, observacoes_perda, valor_orcamento, 
          tipo_porta, data_inicio_atendimento, canal_aquisicao, observacoes
        `)
        .order("data_envio", { ascending: false })
        .limit(50);

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
          id,
          created_at,
          updated_at,
          status,
          status_orcamento,
          usuario_id,
          lead_id,
          atendente_id,
          valor_produto,
          valor_pintura,
          valor_frete,
          valor_instalacao,
          valor_total,
          desconto_percentual,
          desconto_adicional_percentual,
          desconto_adicional_valor,
          tipo_desconto_adicional,
          requer_analise,
          motivo_analise,
          aprovado_por,
          data_aprovacao,
          observacoes_aprovacao,
          classe,
          forma_pagamento,
          cliente_nome,
          cliente_cpf,
          cliente_telefone,
          cliente_email,
          cliente_cep,
          cliente_bairro,
          cliente_cidade,
          cliente_estado,
          modalidade_instalacao,
          canal_aquisicao_id,
          publico_alvo,
          motivo_perda,
          justificativa_perda,
          campos_personalizados,
          elisaportas_leads (nome, telefone, email),
          admin_users!orcamentos_atendente_id_fkey (nome, foto_perfil_url, role),
          orcamento_produtos (
            id,
            tipo_produto,
            descricao,
            quantidade,
            valor,
            medidas,
            cor
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

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
