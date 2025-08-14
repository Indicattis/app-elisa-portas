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
    atendente_id: userId,
    cliente_nome: formData.cliente_nome,
    cliente_cpf: formData.cliente_cpf,
    cliente_telefone: formData.cliente_telefone,
    cliente_estado: formData.cliente_estado,
    cliente_cidade: formData.cliente_cidade,
    cliente_bairro: formData.cliente_bairro,
    cliente_cep: formData.cliente_cep,
    valor_frete: parseFloat(formData.valor_frete) || 0,
    valor_instalacao: parseFloat(formData.valor_instalacao) || 0,
    modalidade_instalacao: formData.modalidade_instalacao,
    forma_pagamento: formData.forma_pagamento,
    desconto_percentual: formData.desconto_total_percentual || 0,
    valor_total: valorTotal,
    requer_analise: formData.requer_analise,
    motivo_analise: formData.requer_analise ? formData.motivo_analise : null,
    status: 'pendente',
    valor_produto: 0, // Será calculado automaticamente pelo trigger
    valor_pintura: 0,
    campos_personalizados: {},
    canal_aquisicao_id: formData.canal_aquisicao_id || null
  };

  const { data, error } = await supabase
    .from("orcamentos")
    .insert(orcamentoData)
    .select()
    .single();

  if (error) throw error;

  // Salvar produtos do orçamento
  if (produtos.length > 0) {
    const produtosData = produtos.map(produto => {
      // Gerar descrição baseada no tipo de produto se não houver uma específica
      let descricao = produto.descricao;
      if (!descricao) {
        switch (produto.tipo_produto) {
          case 'porta_enrolar':
            descricao = `Porta de Enrolar${produto.medidas ? ` - ${produto.medidas}` : ''}`;
            break;
          case 'porta_social':
            descricao = `Porta Social${produto.medidas ? ` - ${produto.medidas}` : ''}`;
            break;
          case 'acessorio':
            descricao = 'Acessório';
            break;
          case 'adicional':
            descricao = 'Adicional';
            break;
          case 'manutencao':
            descricao = produto.descricao_manutencao || 'Serviço de Manutenção';
            break;
          case 'pintura_epoxi':
            descricao = 'Pintura Epóxi';
            break;
          default:
            descricao = produto.tipo_produto;
        }
      }

      return {
        orcamento_id: data.id,
        tipo_produto: produto.tipo_produto,
        medidas: produto.medidas || null,
        cor_id: produto.cor_id || null,
        acessorio_id: produto.acessorio_id || null,
        adicional_id: produto.adicional_id || null,
        descricao: descricao,
        descricao_manutencao: produto.descricao_manutencao || null,
        valor: produto.valor,
        preco_producao: produto.preco_producao || 0,
        preco_instalacao: produto.preco_instalacao || 0,
        desconto_percentual: produto.desconto_percentual || 0
      };
    });

    const { error: produtosError } = await supabase
      .from("orcamento_produtos")
      .insert(produtosData);

    if (produtosError) throw produtosError;
  }

  // Atualizar valor do orçamento no lead
  if (formData.lead_id) {
    await supabase
      .from("elisaportas_leads")
      .update({ valor_orcamento: valorTotal })
      .eq("id", formData.lead_id);
  }

  return data;
};

export const updateOrcamento = async (
  orcamentoId: string,
  formData: OrcamentoFormData,
  produtos: OrcamentoProduto[],
  valorTotal: number
) => {
  // Validar motivo da análise se necessário
  if (formData.requer_analise && !formData.motivo_analise.trim()) {
    throw new Error("Motivo da análise é obrigatório quando necessário");
  }

  const orcamentoData = {
    cliente_nome: formData.cliente_nome,
    cliente_cpf: formData.cliente_cpf,
    cliente_telefone: formData.cliente_telefone,
    cliente_estado: formData.cliente_estado,
    cliente_cidade: formData.cliente_cidade,
    cliente_bairro: formData.cliente_bairro,
    cliente_cep: formData.cliente_cep,
    valor_frete: parseFloat(formData.valor_frete) || 0,
    valor_instalacao: parseFloat(formData.valor_instalacao) || 0,
    modalidade_instalacao: formData.modalidade_instalacao,
    forma_pagamento: formData.forma_pagamento,
    desconto_percentual: formData.desconto_total_percentual || 0,
    valor_total: valorTotal,
    requer_analise: formData.requer_analise,
    motivo_analise: formData.requer_analise ? formData.motivo_analise : null,
    valor_produto: 0, // Será calculado automaticamente pelo trigger
    valor_pintura: 0,
    canal_aquisicao_id: formData.canal_aquisicao_id || null
  };

  const { error } = await supabase
    .from("orcamentos")
    .update(orcamentoData)
    .eq("id", orcamentoId);

  if (error) throw error;

  // Deletar produtos existentes e inserir novos
  const { error: deleteError } = await supabase
    .from("orcamento_produtos")
    .delete()
    .eq("orcamento_id", orcamentoId);

  if (deleteError) throw deleteError;

  // Salvar novos produtos do orçamento
  if (produtos.length > 0) {
    const produtosData = produtos.map(produto => {
      // Gerar descrição baseada no tipo de produto se não houver uma específica
      let descricao = produto.descricao;
      if (!descricao) {
        switch (produto.tipo_produto) {
          case 'porta_enrolar':
            descricao = `Porta de Enrolar${produto.medidas ? ` - ${produto.medidas}` : ''}`;
            break;
          case 'porta_social':
            descricao = `Porta Social${produto.medidas ? ` - ${produto.medidas}` : ''}`;
            break;
          case 'acessorio':
            descricao = 'Acessório';
            break;
          case 'adicional':
            descricao = 'Adicional';
            break;
          case 'manutencao':
            descricao = produto.descricao_manutencao || 'Serviço de Manutenção';
            break;
          case 'pintura_epoxi':
            descricao = 'Pintura Epóxi';
            break;
          default:
            descricao = produto.tipo_produto;
        }
      }

      return {
        orcamento_id: orcamentoId,
        tipo_produto: produto.tipo_produto,
        medidas: produto.medidas || null,
        cor_id: produto.cor_id || null,
        acessorio_id: produto.acessorio_id || null,
        adicional_id: produto.adicional_id || null,
        descricao: descricao,
        descricao_manutencao: produto.descricao_manutencao || null,
        valor: produto.valor,
        preco_producao: produto.preco_producao || 0,
        preco_instalacao: produto.preco_instalacao || 0,
        desconto_percentual: produto.desconto_percentual || 0
      };
    });

    const { error: produtosError } = await supabase
      .from("orcamento_produtos")
      .insert(produtosData);

    if (produtosError) throw produtosError;
  }

  // Atualizar valor do orçamento no lead
  if (formData.lead_id) {
    await supabase
      .from("elisaportas_leads")
      .update({ valor_orcamento: valorTotal })
      .eq("id", formData.lead_id);
  }

  return { id: orcamentoId };
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
