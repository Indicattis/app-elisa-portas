
export const calcularValorTotal = (
  valor_produto: string,
  valor_pintura: string,
  valor_frete: string,
  valor_instalacao: string,
  camposPersonalizados: Array<{ nome: string; valor: string }>,
  desconto_percentual: number
) => {
  const valorProduto = parseFloat(valor_produto) || 0;
  const valorPintura = parseFloat(valor_pintura) || 0;
  const valorFrete = parseFloat(valor_frete) || 0;
  const valorInstalacao = parseFloat(valor_instalacao) || 0;
  
  const valorCamposPersonalizados = camposPersonalizados.reduce((sum, campo) => {
    return sum + (parseFloat(campo.valor) || 0);
  }, 0);

  const subtotal = valorProduto + valorPintura + valorFrete + valorInstalacao + valorCamposPersonalizados;
  const desconto = (valorProduto * desconto_percentual) / 100;
  
  return subtotal - desconto;
};

export const generatePDF = async (orcamento: any, toast: any) => {
  // Simular geração do PDF - aqui seria implementada a geração real
  toast({
    title: "PDF Gerado",
    description: "O orçamento foi baixado com sucesso",
  });
};

export const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case 'pendente':
      return { 
        variant: "outline" as const, 
        className: "text-yellow-600 border-yellow-600",
        icon: "Clock",
        text: "Pendente"
      };
    case 'aprovado':
      return { 
        variant: "outline" as const, 
        className: "text-green-600 border-green-600",
        icon: "CheckCircle",
        text: "Aprovado"
      };
    case 'reprovado':
      return { 
        variant: "outline" as const, 
        className: "text-red-600 border-red-600",
        icon: "XCircle",
        text: "Reprovado"
      };
    default:
      return { 
        variant: "outline" as const, 
        className: "",
        icon: "Circle",
        text: "Desconhecido"
      };
  }
};
