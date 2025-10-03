import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendaRelatorio {
  data_venda: string;
  cliente_nome: string;
  cliente_telefone: string;
  cidade: string;
  estado: string;
  previsao_entrega: string;
  quantidade_portas: number;
  valor_venda: number;
  atendente_nome: string;
}

interface FiltrosAtivos {
  minhasVendas: boolean;
  vendasMesAtual: boolean;
  busca: string;
}

interface VendasRelatorioPDFData {
  vendas: VendaRelatorio[];
  stats: {
    totalVendas: number;
    totalValor: number;
    totalPortas: number;
  };
  filtros: FiltrosAtivos;
}

export const generateVendasRelatorioPDF = (data: VendasRelatorioPDFData) => {
  const doc = new jsPDF();
  const primaryColor = '#2980B9';
  
  let yPos = 20;
  
  // Logo da empresa
  const logoUrl = '/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png';
  try {
    doc.addImage(logoUrl, 'PNG', 15, yPos, 40, 15);
  } catch (error) {
    console.warn('Logo não carregada:', error);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('ELISA PORTAS', 15, yPos + 10);
  }
  
  yPos += 25;
  
  // Título do documento
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE VENDAS', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
  
  yPos += 10;
  
  // Data de geração
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${dataGeracao}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
  
  yPos += 12;
  
  // Filtros aplicados
  if (data.filtros.minhasVendas || data.filtros.vendasMesAtual || data.filtros.busca) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Filtros aplicados:', 15, yPos);
    yPos += 5;
    
    const filtrosTexto: string[] = [];
    if (data.filtros.minhasVendas) filtrosTexto.push('Minhas Vendas');
    if (data.filtros.vendasMesAtual) filtrosTexto.push('Vendas deste Mês');
    if (data.filtros.busca) filtrosTexto.push(`Busca: "${data.filtros.busca}"`);
    
    doc.setFontSize(8);
    doc.text(filtrosTexto.join(' | '), 15, yPos);
    yPos += 10;
  }
  
  // Cards de estatísticas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  
  const cardWidth = 60;
  const cardX1 = 15;
  const cardX2 = cardX1 + cardWidth + 5;
  const cardX3 = cardX2 + cardWidth + 5;
  
  // Card 1: Total de Vendas
  doc.setFillColor(240, 240, 240);
  doc.rect(cardX1, yPos, cardWidth, 15, 'F');
  doc.text('Total de Vendas', cardX1 + 2, yPos + 6);
  doc.setFontSize(14);
  doc.text(data.stats.totalVendas.toString(), cardX1 + 2, yPos + 12);
  
  // Card 2: Valor Total
  doc.setFontSize(10);
  doc.rect(cardX2, yPos, cardWidth, 15, 'F');
  doc.text('Valor Total', cardX2 + 2, yPos + 6);
  doc.setFontSize(14);
  doc.text(
    data.stats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    cardX2 + 2,
    yPos + 12
  );
  
  // Card 3: Total de Portas
  doc.setFontSize(10);
  doc.rect(cardX3, yPos, cardWidth, 15, 'F');
  doc.text('Total de Portas', cardX3 + 2, yPos + 6);
  doc.setFontSize(14);
  doc.text(data.stats.totalPortas.toString(), cardX3 + 2, yPos + 12);
  
  yPos += 20;
  
  // Tabela de vendas
  const tableData = data.vendas.map(venda => [
    format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR }),
    venda.cliente_nome,
    venda.cliente_telefone || '-',
    `${venda.cidade}/${venda.estado}`,
    venda.previsao_entrega ? format(new Date(venda.previsao_entrega), 'dd/MM/yyyy', { locale: ptBR }) : '-',
    venda.quantidade_portas.toString(),
    venda.valor_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    venda.atendente_nome
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Data', 'Cliente', 'Telefone', 'Cidade/UF', 'Prev. Entrega', 'Portas', 'Valor', 'Atendente']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Data
      1: { cellWidth: 35 }, // Cliente
      2: { cellWidth: 25 }, // Telefone
      3: { cellWidth: 25 }, // Cidade/UF
      4: { cellWidth: 20 }, // Prev. Entrega
      5: { cellWidth: 12, halign: 'center' }, // Portas
      6: { cellWidth: 25, halign: 'right' }, // Valor
      7: { cellWidth: 30 } // Atendente
    },
    margin: { left: 15, right: 15 }
  });
  
  // Rodapé
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
  const fileName = `relatorio-vendas-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
};
