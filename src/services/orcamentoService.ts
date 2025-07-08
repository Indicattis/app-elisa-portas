
import { supabase } from "@/integrations/supabase/client";
import type { OrcamentoFormData, CampoPersonalizado } from "@/types/orcamento";

export const createOrcamento = async (
  formData: OrcamentoFormData,
  camposPersonalizados: CampoPersonalizado[],
  valorTotal: number,
  userId: string
) => {
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
    usuario_id: userId,
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

  return data;
};

export const approveOrcamento = async (
  orcamentoId: string,
  desconto_adicional: number,
  tipo_desconto: string,
  observacoes: string
) => {
  const { error } = await supabase.rpc("aprovar_orcamento", {
    orcamento_uuid: orcamentoId,
    desconto_adicional,
    tipo_desconto,
    observacoes: observacoes || null
  });

  if (error) throw error;
};

export const rejectOrcamento = async (orcamentoId: string) => {
  const { error } = await supabase
    .from("orcamentos")
    .update({ status: 'reprovado' })
    .eq("id", orcamentoId);

  if (error) throw error;
};
