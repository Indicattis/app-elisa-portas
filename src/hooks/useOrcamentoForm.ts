
import { useState } from "react";
import type { OrcamentoFormData, CampoPersonalizado } from "@/types/orcamento";
import type { OrcamentoProduto, OrcamentoCusto } from "@/types/produto";

export function useOrcamentoForm() {
  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: "",
    cliente_id: "",
    cliente_nome: "",
    cliente_cpf: "",
    cliente_telefone: "",
    cliente_email: "",
    cliente_estado: "",
    cliente_cidade: "",
    cliente_bairro: "",
    cliente_cep: "",
    cliente_endereco: "",
    valor_frete: "0",
    publico_alvo: "",
    tipo_entrega: "instalacao",
    forma_pagamento: "",
    desconto_total_percentual: 0,
    requer_analise: false,
    motivo_analise: "",
    data_orcamento: "",
    observacoes: "",
    valor_credito: 0,
    percentual_credito: 0
  });

  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([]);
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);
  const [custos, setCustos] = useState<OrcamentoCusto[]>([]);

  const resetForm = () => {
    setFormData({
      lead_id: "",
      cliente_id: "",
      cliente_nome: "",
      cliente_cpf: "",
      cliente_telefone: "",
      cliente_email: "",
      cliente_estado: "",
      cliente_cidade: "",
      cliente_bairro: "",
      cliente_cep: "",
      cliente_endereco: "",
      valor_frete: "0",
      publico_alvo: "",
      tipo_entrega: "instalacao",
      forma_pagamento: "",
      desconto_total_percentual: 0,
      requer_analise: false,
      motivo_analise: "",
      data_orcamento: "",
      observacoes: "",
      valor_credito: 0,
      percentual_credito: 0
    });
    setCamposPersonalizados([]);
    setProdutos([]);
    setCustos([]);
  };

  return {
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    produtos,
    setProdutos,
    custos,
    setCustos,
    resetForm
  };
}
