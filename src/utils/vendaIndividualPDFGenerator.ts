import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProdutoVenda {
  tipo_produto: string;
  tamanho?: string;
  largura?: number;
  altura?: number;
  cor?: { nome: string; codigo_hex?: string } | null;
  valor_produto: number;
  valor_pintura?: number;
  valor_instalacao?: number;
  desconto_percentual?: number;
  desconto_valor?: number;
  tipo_desconto?: string;
  quantidade?: number;
  descricao?: string;
}

interface VendaPDFData {
  id: string;
  numeroVenda?: string;
  dataVenda: string;
  dataPrevistaEntrega?: string;
  cliente: {
    nome: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    bairro?: string;
  };
  produtos: ProdutoVenda[];
  valores: {
    valorVenda: number;
    valorFrete?: number;
    valorInstalacao?: number;
    valorEntrada?: number;
    valorAReceber?: number;
  };
  formaPagamento?: string;
  observacoes?: string;
  atendente?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export const generateVendaPDF = (data: VendaPDFData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 10;
  let yPosition = 15;

  // Cores
  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  const successColor = [34, 139, 34] as [number, number, number];

  pdf.setFont('helvetica', 'normal');

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const getTipoProdutoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      porta_enrolar: 'Porta de Enrolar',
      porta_social: 'Porta Social',
      acessorio: 'Acessório',
      manutencao: 'Manutenção',
      adicional: 'Adicional',
      pintura_epoxi: 'Pintura Epóxi',
      instalacao: 'Instalação',
    };
    return labels[tipo] || tipo;
  };

  // Logo da empresa
  try {
    pdf.addImage('/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png', 'PNG', margin, yPosition - 10, 60, 25);
  } catch (error) {
    pdf.setFontSize(20);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELISA PORTAS LTDA', margin, yPosition);
  }

  // Informações da empresa
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  const empresaInfo = [
    'Rua Padre Elio Baron Toaldo, 571',
    '95055652 - Caxias do Sul, RS',
    'CNPJ: 59.277.825/0001-09'
  ];
  empresaInfo.forEach((info, index) => {
    pdf.text(info, pageWidth - margin - 60, yPosition + (index * 5));
  });

  // Linha divisória
  pdf.setDrawColor(...grayColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition + 15, pageWidth - margin, yPosition + 15);
  yPosition += 25;

  // Título
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPROVANTE DE VENDA', margin, yPosition);

  const numeroVenda = data.numeroVenda || `VND-${data.id.slice(-8).toUpperCase()}`;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nº: ${numeroVenda}`, pageWidth - margin - 50, yPosition);
  yPosition += 6;
  pdf.setFontSize(9);
  pdf.text(`Data: ${formatDate(data.dataVenda)}`, pageWidth - margin - 50, yPosition);
  yPosition += 10;

  // Dados do cliente
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO CLIENTE', margin, yPosition);
  yPosition += 6;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition - 3, pageWidth - (margin * 2), 28, 'F');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  pdf.text(`Nome: ${data.cliente.nome || 'Não informado'}`, margin + 3, yPosition + 3);
  pdf.text(`CPF: ${data.cliente.cpf || 'Não informado'}`, margin + 3, yPosition + 9);
  pdf.text(`Telefone: ${data.cliente.telefone || 'Não informado'}`, margin + 3, yPosition + 15);
  pdf.text(`Email: ${data.cliente.email || 'Não informado'}`, margin + 3, yPosition + 21);

  pdf.text(`Estado: ${data.cliente.estado || 'Não informado'}`, pageWidth / 2, yPosition + 3);
  pdf.text(`Cidade: ${data.cliente.cidade || 'Não informado'}`, pageWidth / 2, yPosition + 9);
  pdf.text(`CEP: ${data.cliente.cep || 'Não informado'}`, pageWidth / 2, yPosition + 15);
  pdf.text(`Bairro: ${data.cliente.bairro || 'Não informado'}`, pageWidth / 2, yPosition + 21);

  yPosition += 33;

  // Atendente
  if (data.atendente?.nome) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ATENDENTE RESPONSÁVEL', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.atendente.nome, margin + 3, yPosition + 3);
    yPosition += 12;
  }

  // Produtos
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTOS E SERVIÇOS', margin, yPosition);
  yPosition += 5;

  if (data.produtos && data.produtos.length > 0) {
    const tableData = data.produtos.map(produto => {
      const categoria = getTipoProdutoLabel(produto.tipo_produto);
      let descricao = '';

      if (produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta_social') {
        if (produto.largura && produto.altura) {
          descricao = `${produto.largura.toFixed(2)}m x ${produto.altura.toFixed(2)}m`;
        } else if (produto.tamanho) {
          descricao = produto.tamanho;
        }
        if (produto.cor?.nome) {
          descricao += ` - ${produto.cor.nome}`;
        }
      } else if (produto.tipo_produto === 'pintura_epoxi') {
        descricao = produto.cor?.nome || 'Pintura Epóxi';
      } else {
        descricao = produto.descricao || categoria;
      }

      const quantidade = produto.quantidade || 1;
      const valorUnitario = produto.valor_produto + (produto.valor_pintura || 0) + (produto.valor_instalacao || 0);
      
      let desconto = 0;
      if (produto.tipo_desconto === 'percentual' && produto.desconto_percentual) {
        desconto = valorUnitario * (produto.desconto_percentual / 100);
      } else if (produto.tipo_desconto === 'valor' && produto.desconto_valor) {
        desconto = produto.desconto_valor;
      }
      
      const valorFinal = (valorUnitario - desconto) * quantidade;

      return [
        categoria,
        descricao,
        quantidade.toString(),
        formatCurrency(valorUnitario),
        desconto > 0 ? formatCurrency(desconto) : '-',
        formatCurrency(valorFinal)
      ];
    });

    autoTable(pdf, {
      head: [['Categoria', 'Descrição', 'Qtd', 'Valor Un.', 'Desconto', 'Total']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },
        1: { halign: 'left', cellWidth: 55 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('Nenhum produto registrado', margin, yPosition + 5);
    yPosition += 15;
  }

  // Resumo financeiro
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO FINANCEIRO', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  const valorProdutos = (data.valores.valorVenda || 0) - (data.valores.valorFrete || 0);
  
  // Valor dos produtos
  pdf.text('Valor dos Produtos:', margin, yPosition);
  pdf.text(formatCurrency(valorProdutos), pageWidth - margin - pdf.getTextWidth(formatCurrency(valorProdutos)), yPosition);
  yPosition += 6;

  // Frete
  if (data.valores.valorFrete && data.valores.valorFrete > 0) {
    pdf.text('Frete:', margin, yPosition);
    pdf.text(formatCurrency(data.valores.valorFrete), pageWidth - margin - pdf.getTextWidth(formatCurrency(data.valores.valorFrete)), yPosition);
    yPosition += 6;
  }

  // Linha divisória
  pdf.setDrawColor(...grayColor);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', margin, yPosition);
  const totalText = formatCurrency(data.valores.valorVenda || 0);
  pdf.text(totalText, pageWidth - margin - pdf.getTextWidth(totalText), yPosition);
  yPosition += 10;

  // Entrada e saldo
  if (data.valores.valorEntrada && data.valores.valorEntrada > 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...successColor);
    pdf.text(`Entrada: ${formatCurrency(data.valores.valorEntrada)}`, margin, yPosition);
    
    if (data.valores.valorAReceber) {
      pdf.setTextColor(0, 0, 0);
      const saldoText = `Saldo: ${formatCurrency(data.valores.valorAReceber)}`;
      pdf.text(saldoText, pageWidth - margin - pdf.getTextWidth(saldoText), yPosition);
    }
    yPosition += 8;
  }

  // Forma de pagamento
  pdf.setTextColor(0, 0, 0);
  if (data.formaPagamento) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Forma de Pagamento: ${data.formaPagamento}`, margin, yPosition);
    yPosition += 8;
  }

  // Previsão de entrega
  if (data.dataPrevistaEntrega) {
    pdf.text(`Previsão de Entrega: ${formatDate(data.dataPrevistaEntrega)}`, margin, yPosition);
    yPosition += 8;
  }

  // Observações
  if (data.observacoes && data.observacoes.trim()) {
    yPosition += 5;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES:', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...grayColor);
    const linhasObs = pdf.splitTextToSize(data.observacoes, pageWidth - 2 * margin);
    linhasObs.forEach((linha: string) => {
      pdf.text(linha, margin, yPosition);
      yPosition += 5;
    });
  }

  // Rodapé
  yPosition = pdf.internal.pageSize.height - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Este documento é um comprovante de venda e não possui valor fiscal.', margin, yPosition);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, yPosition + 5);
  pdf.text('Contato: comercial@elisaportas.com.br | (54) 3025-5525', margin, yPosition + 10);

  // Salvar
  const fileName = `venda-${numeroVenda}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
