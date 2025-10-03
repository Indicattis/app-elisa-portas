import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendaFaturamento {
  id: string;
  data_venda: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  atendente_nome: string;
  valor_venda: number;
  valor_produto: number;
  valor_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  custo_produto: number;
  custo_pintura: number;
  portas?: any[];
}

interface FaturamentoPDFData {
  vendas: VendaFaturamento[];
  stats: {
    faturamentoTotal: number;
    custosProducao: number;
    custosPintura: number;
    lucroBrutoTotal: number;
    instalacoesTotais: number;
    fretesTotais: number;
  };
  filtros?: {
    tab?: 'todas' | 'faturadas' | 'nao_faturadas';
    periodo?: string;
  };
}

// Função auxiliar para calcular total de descontos
const calculateTotalDiscount = (venda: VendaFaturamento): number => {
  const portas = venda.portas || [];
  let totalDescontoValor = 0;
  
  portas.forEach((produto: any) => {
    if (produto.tipo_desconto === 'valor') {
      totalDescontoValor += produto.desconto_valor || 0;
    } else if (produto.tipo_desconto === 'percentual') {
      const valorProduto = produto.valor_produto || 0;
      const desconto = (valorProduto * (produto.desconto_percentual || 0)) / 100;
      totalDescontoValor += desconto;
    }
  });
  
  return totalDescontoValor;
};

// Função auxiliar para verificar se venda está faturada
const isFaturada = (venda: VendaFaturamento): boolean => {
  return (venda.custo_produto || 0) > 0 || (venda.custo_pintura || 0) > 0;
};

// Função auxiliar para formatar moeda
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2 
  });
};

export const generateFaturamentoPDF = (data: FaturamentoPDFData) => {
  const doc = new jsPDF('landscape'); // Landscape para mais colunas
  
  // Cores do design system
  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  const greenColor = [22, 163, 74] as [number, number, number];
  const redColor = [220, 38, 38] as [number, number, number];
  const orangeColor = [234, 88, 12] as [number, number, number];
  
  let yPos = 20;
  
  // Logo da empresa
  const logoUrl = '/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png';
  try {
    doc.addImage(logoUrl, 'PNG', 15, yPos, 40, 15);
  } catch (error) {
    console.warn('Logo não carregada:', error);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ELISA PORTAS', 15, yPos + 10);
  }
  
  yPos += 25;
  
  // Título do documento
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE FATURAMENTO', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
  
  yPos += 10;
  
  // Data de geração
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${dataGeracao}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
  
  yPos += 5;
  
  // Filtros aplicados
  if (data.filtros) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    const filtrosTexto: string[] = [];
    
    if (data.filtros.tab === 'faturadas') filtrosTexto.push('Vendas Faturadas');
    if (data.filtros.tab === 'nao_faturadas') filtrosTexto.push('Vendas Não Faturadas');
    if (data.filtros.periodo) filtrosTexto.push(`Período: ${data.filtros.periodo}`);
    
    if (filtrosTexto.length > 0) {
      doc.text(`Filtros: ${filtrosTexto.join(' | ')}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 10;
    }
  }
  
  yPos += 5;
  
  // Cards de indicadores (2 linhas x 3 colunas)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  const cardWidth = 85;
  const cardHeight = 18;
  const cardSpacing = 5;
  const startX = 15;
  
  // Primeira linha de cards
  const cards1 = [
    { label: 'Faturamento Total (sem frete)', value: formatCurrency(data.stats.faturamentoTotal), color: primaryColor },
    { label: 'Custos de Produção', value: formatCurrency(data.stats.custosProducao), color: orangeColor },
    { label: 'Custos de Pintura', value: formatCurrency(data.stats.custosPintura), color: orangeColor },
  ];
  
  cards1.forEach((card, index) => {
    const x = startX + (cardWidth + cardSpacing) * index;
    
    // Fundo do card
    doc.setFillColor(245, 245, 245);
    doc.rect(x, yPos, cardWidth, cardHeight, 'F');
    
    // Label
    doc.setTextColor(80);
    doc.setFontSize(8);
    doc.text(card.label, x + 3, yPos + 6);
    
    // Valor
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 3, yPos + 14);
  });
  
  yPos += cardHeight + cardSpacing;
  
  // Segunda linha de cards
  const lucroTotal = data.stats.faturamentoTotal - data.stats.custosProducao - data.stats.custosPintura;
  const lucroColor = lucroTotal >= 0 ? greenColor : redColor;
  
  const cards2 = [
    { label: 'Lucro Bruto Total', value: formatCurrency(lucroTotal), color: lucroColor },
    { label: 'Instalações Totais', value: formatCurrency(data.stats.instalacoesTotais), color: primaryColor },
    { label: 'Fretes Totais', value: formatCurrency(data.stats.fretesTotais), color: grayColor },
  ];
  
  cards2.forEach((card, index) => {
    const x = startX + (cardWidth + cardSpacing) * index;
    
    // Fundo do card
    doc.setFillColor(245, 245, 245);
    doc.rect(x, yPos, cardWidth, cardHeight, 'F');
    
    // Label
    doc.setTextColor(80);
    doc.setFontSize(8);
    doc.text(card.label, x + 3, yPos + 6);
    
    // Valor
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 3, yPos + 14);
  });
  
  yPos += cardHeight + 10;
  
  // Tabela de vendas
  const tableData = data.vendas.map(venda => {
    const status = isFaturada(venda) ? '✓ Faturada' : '✗ Não Fat.';
    const descontos = calculateTotalDiscount(venda);
    const custosTotais = (venda.custo_produto || 0) + (venda.custo_pintura || 0);
    const faturamento = (venda.valor_venda || 0) - (venda.valor_frete || 0);
    const lucro = faturamento - custosTotais;
    
    return [
      status,
      venda.atendente_nome || '-',
      venda.cliente_nome || '-',
      format(new Date(venda.data_venda), 'dd/MM/yy', { locale: ptBR }),
      formatCurrency(venda.valor_produto || 0),
      descontos > 0 ? formatCurrency(descontos) : '-',
      formatCurrency(custosTotais),
      formatCurrency(venda.valor_instalacao || 0),
      formatCurrency(venda.valor_frete || 0),
      formatCurrency(lucro),
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Atendente', 'Cliente', 'Data', 'Valor Prod.', 'Descontos', 'Custos', 'Instalação', 'Frete', 'Lucro']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' }, // Status
      1: { cellWidth: 28 }, // Atendente
      2: { cellWidth: 35 }, // Cliente
      3: { cellWidth: 18, halign: 'center' }, // Data
      4: { cellWidth: 22, halign: 'right' }, // Valor Produtos
      5: { cellWidth: 20, halign: 'right' }, // Descontos
      6: { cellWidth: 22, halign: 'right' }, // Custos
      7: { cellWidth: 22, halign: 'right' }, // Instalação
      8: { cellWidth: 20, halign: 'right' }, // Frete
      9: { cellWidth: 22, halign: 'right' }, // Lucro
    },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      // Colorir coluna de lucro
      if (data.column.index === 9 && data.section === 'body') {
        const lucroText = data.cell.text[0];
        if (lucroText.includes('-')) {
          data.cell.styles.textColor = redColor;
        } else {
          data.cell.styles.textColor = greenColor;
        }
      }
      
      // Colorir coluna de custos
      if (data.column.index === 6 && data.section === 'body') {
        data.cell.styles.textColor = orangeColor;
      }
      
      // Colorir coluna de descontos
      if (data.column.index === 5 && data.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = redColor;
      }
    }
  });
  
  // Resumo estatístico após a tabela
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RESUMO ESTATÍSTICO', 15, finalY);
  
  const vendasFaturadas = data.vendas.filter(isFaturada);
  const vendasNaoFaturadas = data.vendas.filter(v => !isFaturada(v));
  const percentualFaturadas = data.vendas.length > 0 
    ? ((vendasFaturadas.length / data.vendas.length) * 100).toFixed(1)
    : '0';
  
  const lucroMedioFaturadas = vendasFaturadas.length > 0
    ? vendasFaturadas.reduce((acc, v) => {
        const faturamento = (v.valor_venda || 0) - (v.valor_frete || 0);
        const custos = (v.custo_produto || 0) + (v.custo_pintura || 0);
        return acc + (faturamento - custos);
      }, 0) / vendasFaturadas.length
    : 0;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  
  let summaryY = finalY + 7;
  doc.text(`• Total de vendas: ${data.vendas.length}`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Vendas faturadas: ${vendasFaturadas.length} (${percentualFaturadas}%)`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Vendas não faturadas: ${vendasNaoFaturadas.length}`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Lucro médio por venda faturada: ${formatCurrency(lucroMedioFaturadas)}`, 15, summaryY);
  
  // Rodapé com paginação
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.text(
      'Elisa Portas - contato@elisaportas.com.br - (51) 99999-9999',
      doc.internal.pageSize.getWidth() / 2,
      footerY,
      { align: 'center' }
    );
    
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 20,
      footerY,
      { align: 'right' }
    );
  }
  
  // Salvar o PDF
  const fileName = `relatorio-faturamento-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
};
