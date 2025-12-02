import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EstoquePDF {
  id: string;
  sku: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  categoria: string;
  setor_responsavel_producao: string | null;
  requer_pintura: boolean | null;
  pontuacao_producao: number;
  quantidade: number;
  quantidade_ideal: number | null;
  unidade: string | null;
  custo_unitario: number;
}

interface EstoquePDFData {
  produtos: EstoquePDF[];
  categoriasMap: Record<string, string>;
}

const setorLabel = (setor: string | null): string => {
  if (!setor) return '-';
  const map: Record<string, string> = {
    perfiladeira: 'Perfiladeira',
    soldagem: 'Soldagem',
    separacao: 'Separação',
    pintura: 'Pintura',
  };
  return map[setor] || setor;
};

export const gerarEstoquePDF = (data: EstoquePDFData): jsPDF => {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  
  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE ESTOQUE', 148, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 148, 27, { align: 'center' });
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 32, 282, 32);

  // Preparar dados da tabela
  const tableData = data.produtos.map(p => [
    p.sku || '-',
    p.nome_produto,
    data.categoriasMap[p.categoria] || '-',
    setorLabel(p.setor_responsavel_producao),
    p.requer_pintura ? 'Sim' : 'Não',
    p.pontuacao_producao.toFixed(2),
    `${p.quantidade} ${p.unidade || 'UN'}`,
    `R$ ${p.custo_unitario.toFixed(2)}`,
  ]);

  // Tabela de produtos
  autoTable(doc, {
    head: [['SKU', 'Produto', 'Categoria', 'Setor', 'Pintura', 'Pts/Un', 'Estoque', 'Custo']],
    body: tableData,
    startY: 38,
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' }, // SKU
      1: { cellWidth: 55, halign: 'left' },   // Produto
      2: { cellWidth: 32, halign: 'left' },   // Categoria
      3: { cellWidth: 30, halign: 'center' }, // Setor
      4: { cellWidth: 20, halign: 'center' }, // Pintura
      5: { cellWidth: 20, halign: 'center' }, // Pts/Un
      6: { cellWidth: 30, halign: 'right' },  // Estoque
      7: { cellWidth: 30, halign: 'right' },  // Custo
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  });

  // Calcular estatísticas
  const totalProdutos = data.produtos.length;
  const valorTotalEstoque = data.produtos.reduce((sum, p) => sum + (p.quantidade * p.custo_unitario), 0);
  const produtosEstoqueBaixo = data.produtos.filter(p => p.quantidade_ideal && p.quantidade < p.quantidade_ideal).length;
  
  // Distribuição por categoria
  const distribCategoria: Record<string, number> = {};
  data.produtos.forEach(p => {
    const catNome = data.categoriasMap[p.categoria] || 'Sem categoria';
    distribCategoria[catNome] = (distribCategoria[catNome] || 0) + 1;
  });
  
  // Distribuição por setor
  const distribSetor: Record<string, number> = {};
  data.produtos.forEach(p => {
    const setorNome = setorLabel(p.setor_responsavel_producao);
    distribSetor[setorNome] = (distribSetor[setorNome] || 0) + 1;
  });

  // Resumo estatístico
  const finalY = (doc as any).lastAutoTable.finalY || 38;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO ESTATÍSTICO', 14, finalY + 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  let yPos = finalY + 22;
  doc.text(`Total de produtos cadastrados: ${totalProdutos}`, 14, yPos);
  yPos += 6;
  doc.text(`Valor total do estoque: R$ ${valorTotalEstoque.toFixed(2)}`, 14, yPos);
  yPos += 6;
  doc.text(`Produtos com estoque baixo: ${produtosEstoqueBaixo}`, 14, yPos);
  
  // Distribuição por categoria
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Categoria:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  Object.entries(distribCategoria).forEach(([cat, count]) => {
    doc.text(`  • ${cat}: ${count} produto${count > 1 ? 's' : ''}`, 14, yPos);
    yPos += 5;
  });
  
  // Distribuição por setor
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Setor:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  Object.entries(distribSetor).forEach(([setor, count]) => {
    doc.text(`  • ${setor}: ${count} produto${count > 1 ? 's' : ''}`, 14, yPos);
    yPos += 5;
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Página ${i} de ${pageCount}`, 148, 200, { align: 'center' });
    doc.text('Sistema de Gestão Elisa Portas', 148, 205, { align: 'center' });
  }

  return doc;
};

export const baixarEstoquePDF = (data: EstoquePDFData) => {
  const doc = gerarEstoquePDF(data);
  const dataAtual = format(new Date(), 'yyyy-MM-dd_HHmm');
  doc.save(`relatorio-estoque-${dataAtual}.pdf`);
};

export const imprimirEstoquePDF = (data: EstoquePDFData) => {
  const doc = gerarEstoquePDF(data);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
