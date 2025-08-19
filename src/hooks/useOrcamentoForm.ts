
import { useState } from "react";
import type { OrcamentoFormData, CampoPersonalizado } from "@/types/orcamento";
import type { OrcamentoProduto, OrcamentoCusto } from "@/types/produto";

export function useOrcamentoForm() {
  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: "",
    cliente_nome: "",
    cliente_cpf: "",
    cliente_telefone: "",
    cliente_email: "",
    cliente_estado: "",
    cliente_cidade: "",
    cliente_bairro: "",
    cliente_cep: "",
    valor_frete: "0",
    valor_instalacao: "0",
    modalidade_instalacao: "instalacao_elisa",
    forma_pagamento: "",
    desconto_total_percentual: 0,
    requer_analise: false,
    motivo_analise: ""
  });

  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([]);
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);
  const [custos, setCustos] = useState<OrcamentoCusto[]>([]);

  const resetForm = () => {
    setFormData({
      lead_id: "",
      cliente_nome: "",
      cliente_cpf: "",
      cliente_telefone: "",
      cliente_email: "",
      cliente_estado: "",
      cliente_cidade: "",
      cliente_bairro: "",
      cliente_cep: "",
      valor_frete: "0",
      valor_instalacao: "0",
      modalidade_instalacao: "instalacao_elisa",
      forma_pagamento: "",
      desconto_total_percentual: 0,
      requer_analise: false,
      motivo_analise: ""
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
