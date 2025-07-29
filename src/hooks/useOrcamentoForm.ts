
import { useState } from "react";
import type { OrcamentoFormData, CampoPersonalizado } from "@/types/orcamento";
import type { OrcamentoProduto } from "@/types/produto";

export function useOrcamentoForm() {
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

  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([]);
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);

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
    setProdutos([]);
  };

  return {
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    produtos,
    setProdutos,
    resetForm
  };
}
