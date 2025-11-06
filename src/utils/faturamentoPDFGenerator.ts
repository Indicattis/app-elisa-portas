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
    quantidadePortas?: number;
    lucroPortas?: number;
    lucroPintura?: number;
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
  
  // Cores do design system - Nova paleta com primária #1d76cf
  const primaryColor = [29, 118, 207] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  const greenColor = [22, 163, 74] as [number, number, number];
  const redColor = [220, 38, 38] as [number, number, number];
  const orangeColor = [234, 88, 12] as [number, number, number];
  const amberColor = [245, 158, 11] as [number, number, number];
  const purpleColor = [168, 85, 247] as [number, number, number];
  const cyanColor = [6, 182, 212] as [number, number, number];
  const indigoColor = [99, 102, 241] as [number, number, number];
  
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
  
  // Cards de indicadores (Grid 3x3 - 7 cards)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  const cardWidth = 85;
  const cardHeight = 18;
  const cardSpacing = 5;
  const startX = 15;
  const cardsPerRow = 3;
  
  const allCards = [
    { label: 'Faturamento (sem Frete)', value: formatCurrency(data.stats.faturamentoTotal), color: primaryColor },
    { label: 'Quantidade de Portas', value: (data.stats.quantidadePortas || 0).toString(), color: grayColor },
    { label: 'Lucro Portas', value: formatCurrency(data.stats.lucroPortas || 0), color: amberColor },
    { label: 'Lucro Pintura', value: formatCurrency(data.stats.lucroPintura || 0), color: purpleColor },
    { label: 'Instalações', value: formatCurrency(data.stats.instalacoesTotais), color: cyanColor },
    { label: 'Fretes', value: formatCurrency(data.stats.fretesTotais), color: indigoColor },
    { label: 'Lucro Bruto Total', value: formatCurrency(data.stats.lucroBrutoTotal), color: greenColor },
  ];
  
  allCards.forEach((card, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    const x = startX + (cardWidth + cardSpacing) * col;
    const y = yPos + (cardHeight + cardSpacing) * row;
    
    // Fundo do card
    doc.setFillColor(245, 245, 245);
    doc.rect(x, y, cardWidth, cardHeight, 'F');
    
    // Label
    doc.setTextColor(80);
    doc.setFontSize(8);
    doc.text(card.label, x + 3, y + 6);
    
    // Valor
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 3, y + 14);
  });
  
  const totalRows = Math.ceil(allCards.length / cardsPerRow);
  yPos += (cardHeight + cardSpacing) * totalRows + 5;
  
  // Tabela de vendas com novas colunas
  const tableData = data.vendas.map(venda => {
    const status = isFaturada(venda) ? '✓' : '✗';
    const descontos = calculateTotalDiscount(venda);
    const custosTotais = (venda.custo_produto || 0) + (venda.custo_pintura || 0);
    const faturamento = (venda.valor_venda || 0) - (venda.valor_frete || 0);
    
    // Calcular lucro usando lucro_item dos produtos (corrigido)
    const portas = venda.portas || [];
    const lucroItens = isFaturada(venda) 
      ? portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0)
      : 0;
    
    // Cálculos adicionais
    const valorOriginal = (venda.valor_produto || 0) + descontos;
    const percentualDesconto = valorOriginal > 0 ? (descontos / valorOriginal) * 100 : 0;
    const margem = custosTotais > 0 ? ((faturamento - custosTotais) / custosTotais) * 100 : 0;
    const lucroLiquido = isFaturada(venda) ? (lucroItens + (venda.valor_instalacao || 0)) : 0;
    const valorFinal = faturamento;
    const valorFinalComFrete = venda.valor_venda || 0;
    
    return [
      status,
      venda.atendente_nome || '-',
      venda.cliente_nome || '-',
      format(new Date(venda.data_venda), 'dd/MM/yy', { locale: ptBR }),
      formatCurrency(venda.valor_produto || 0),
      formatCurrency(venda.valor_pintura || 0),
      descontos > 0 ? formatCurrency(descontos) : '-',
      percentualDesconto > 0 ? `${percentualDesconto.toFixed(1)}%` : '-',
      formatCurrency(custosTotais),
      `${margem.toFixed(1)}%`,
      formatCurrency(venda.valor_instalacao || 0),
      formatCurrency(venda.valor_frete || 0),
      formatCurrency(lucroLiquido),
      formatCurrency(valorFinal),
      formatCurrency(valorFinalComFrete),
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [[
      'St', 'Atendente', 'Cliente', 'Data', 
      'Produtos', 'Pintura', 'Desc.', '%Desc', 
      'Custos', '%Marg', 'Instal.', 'Frete', 
      'Lucro Líq.', 'Vl. Final', 'Vl. c/ Frete'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [50, 50, 50],
      cellPadding: 1.5
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // Status
      1: { cellWidth: 20 }, // Atendente
      2: { cellWidth: 28 }, // Cliente
      3: { cellWidth: 16, halign: 'center' }, // Data
      4: { cellWidth: 18, halign: 'right' }, // Produtos
      5: { cellWidth: 16, halign: 'right' }, // Pintura
      6: { cellWidth: 15, halign: 'right' }, // Descontos
      7: { cellWidth: 12, halign: 'right' }, // %Desc
      8: { cellWidth: 16, halign: 'right' }, // Custos
      9: { cellWidth: 12, halign: 'right' }, // %Marg
      10: { cellWidth: 15, halign: 'right' }, // Instalação
      11: { cellWidth: 14, halign: 'right' }, // Frete
      12: { cellWidth: 18, halign: 'right' }, // Lucro Líquido
      13: { cellWidth: 18, halign: 'right' }, // Valor Final
      14: { cellWidth: 20, halign: 'right' }, // Valor Final c/ Frete
    },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      // Colorir coluna de descontos
      if (data.column.index === 6 && data.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = redColor;
      }
      
      // Colorir % desconto
      if (data.column.index === 7 && data.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = redColor;
      }
      
      // Colorir coluna de custos
      if (data.column.index === 8 && data.section === 'body') {
        data.cell.styles.textColor = orangeColor;
      }
      
      // Colorir % margem
      if (data.column.index === 9 && data.section === 'body') {
        const margemText = data.cell.text[0];
        if (margemText.includes('-')) {
          data.cell.styles.textColor = redColor;
        } else {
          data.cell.styles.textColor = greenColor;
        }
        data.cell.styles.fontStyle = 'bold';
      }
      
      // Colorir lucro líquido
      if (data.column.index === 12 && data.section === 'body') {
        const lucroText = data.cell.text[0];
        if (lucroText.includes('-')) {
          data.cell.styles.textColor = redColor;
        } else {
          data.cell.styles.textColor = greenColor;
        }
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Resumo estatístico aprimorado após a tabela
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RESUMO ESTATÍSTICO DETALHADO', 15, finalY);
  
  const vendasFaturadas = data.vendas.filter(isFaturada);
  const vendasNaoFaturadas = data.vendas.filter(v => !isFaturada(v));
  const percentualFaturadas = data.vendas.length > 0 
    ? ((vendasFaturadas.length / data.vendas.length) * 100).toFixed(1)
    : '0';
  
  const lucroMedioFaturadas = vendasFaturadas.length > 0
    ? vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        // Calcular lucro usando lucro_item + instalações (SEM frete)
        const lucroItens = portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
        const instalacao = v.valor_instalacao || 0;
        return acc + lucroItens + instalacao;
      }, 0) / vendasFaturadas.length
    : 0;
  
  const ticketMedio = data.vendas.length > 0 
    ? data.vendas.reduce((acc, v) => acc + (v.valor_venda || 0), 0) / data.vendas.length
    : 0;
  
  const totalDescontos = data.vendas.reduce((acc, v) => acc + calculateTotalDiscount(v), 0);
  const totalFaturamento = data.vendas.reduce((acc, v) => acc + (v.valor_venda || 0), 0);
  const percentualDescontoMedio = totalFaturamento > 0 
    ? (totalDescontos / totalFaturamento * 100).toFixed(2)
    : '0';
  
  const margemMedia = data.stats.custosProducao + data.stats.custosPintura > 0
    ? ((data.stats.faturamentoTotal - data.stats.custosProducao - data.stats.custosPintura) / 
       (data.stats.custosProducao + data.stats.custosPintura) * 100).toFixed(2)
    : '0';
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  
  let summaryY = finalY + 7;
  doc.text(`• Total de vendas: ${data.vendas.length} | Faturadas: ${vendasFaturadas.length} (${percentualFaturadas}%) | Não faturadas: ${vendasNaoFaturadas.length}`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Ticket médio: ${formatCurrency(ticketMedio)} | Margem média: ${margemMedia}%`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Total em descontos: ${formatCurrency(totalDescontos)} | % Médio de desconto: ${percentualDescontoMedio}%`, 15, summaryY);
  summaryY += 5;
  doc.text(`• Lucro médio por venda faturada: ${formatCurrency(lucroMedioFaturadas)} | Lucro bruto total: ${formatCurrency(data.stats.lucroBrutoTotal)}`, 15, summaryY);
  
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
