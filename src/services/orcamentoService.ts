
import { supabase } from "@/integrations/supabase/client";
import type { OrcamentoFormData, CampoPersonalizado } from "@/types/orcamento";
import type { OrcamentoProduto } from "@/types/produto";

export const createOrcamento = async (
  formData: OrcamentoFormData,
  produtos: OrcamentoProduto[],
  valorTotal: number,
  userId: string
) => {
  // Validar motivo da análise se necessário
  if (formData.requer_analise && !formData.motivo_analise.trim()) {
    throw new Error("Motivo da análise é obrigatório quando necessário");
  }

  const orcamentoData = {
    lead_id: formData.lead_id || null,
    atendente_id: userId, // Atribuir automaticamente ao usuário logado
    cliente_nome: formData.cliente_nome,
    cliente_cpf: formData.cliente_cpf,
    cliente_telefone: formData.cliente_telefone,
    cliente_estado: formData.cliente_estado,
    cliente_cidade: formData.cliente_cidade,
    cliente_bairro: formData.cliente_bairro,
    cliente_cep: formData.cliente_cep,
    valor_frete: parseFloat(formData.valor_frete) || 0,
    modalidade_instalacao: formData.modalidade_instalacao,
    forma_pagamento: formData.forma_pagamento,
    desconto_percentual: formData.desconto_total_percentual || 0,
    valor_total: valorTotal,
    requer_analise: formData.requer_analise,
    motivo_analise: formData.requer_analise ? formData.motivo_analise : null,
    status: formData.requer_analise ? 'pendente' : 'aprovado',
    valor_produto: 0,
    valor_pintura: 0,
    valor_instalacao: 0,
    campos_personalizados: {}
  };

  const { data, error } = await supabase
    .from("orcamentos")
    .insert(orcamentoData)
    .select()
    .single();

  if (error) throw error;

  // Salvar produtos do orçamento
  if (produtos.length > 0) {
    const produtosData = produtos.map(produto => ({
      orcamento_id: data.id,
      tipo_produto: produto.tipo_produto,
      medidas: produto.medidas || null,
      cor_id: produto.cor_id || null,
      acessorio_id: produto.acessorio_id || null,
      adicional_id: produto.adicional_id || null,
      descricao: produto.descricao || null,
      descricao_manutencao: produto.descricao_manutencao || null,
      valor: produto.valor,
      preco_producao: produto.preco_producao || 0,
      preco_instalacao: produto.preco_instalacao || 0,
      desconto_percentual: produto.desconto_percentual || 0
    }));

    const { error: produtosError } = await supabase
      .from("orcamento_produtos")
      .insert(produtosData);

    if (produtosError) throw produtosError;
  }

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
