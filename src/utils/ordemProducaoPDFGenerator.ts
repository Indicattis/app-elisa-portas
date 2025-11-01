import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

interface OrdemProducaoPDFData {
  ordem: {
    id: string;
    numero_ordem: string;
    tipo_ordem: 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';
    status: string;
    observacoes?: string;
    created_at: string;
  };
  pedido: {
    numero_pedido: string;
    cliente_nome: string;
    data_entrega?: string;
    observacoes?: string;
  };
  venda?: {
    forma_pagamento?: string;
    valor_venda?: number;
  };
  produtos: Array<{
    nome_produto: string;
    quantidade: number;
    tamanho?: string;
  }>;
  linhas: Array<{
    item: string;
    quantidade: number;
    tamanho?: string;
    concluida: boolean;
  }>;
}

// Mapa de cores por tipo de ordem (RGB)
const ORDEM_COLORS: Record<string, [number, number, number]> = {
  perfiladeira: [41, 128, 185],     // Azul
  soldagem: [34, 139, 34],          // Verde
  pintura: [255, 140, 0],           // Laranja
  separacao: [255, 193, 7],         // Amarelo/Dourado
  qualidade: [128, 0, 128],         // Roxo
};

// Mapa de labels por tipo
const ORDEM_LABELS: Record<string, string> = {
  perfiladeira: 'PERFILADEIRA',
  soldagem: 'SOLDAGEM',
  pintura: 'PINTURA',
  separacao: 'SEPARAÇÃO',
  qualidade: 'QUALIDADE',
};

export const gerarOrdemProducaoPDF = (data: OrdemProducaoPDFData): jsPDF => {
  const doc = new jsPDF();
  const margemX = 15;
  let posY = 15;
  
  const cor = ORDEM_COLORS[data.ordem.tipo_ordem] || [100, 100, 100];
  const label = ORDEM_LABELS[data.ordem.tipo_ordem] || 'ORDEM';
  
  // Cabeçalho da empresa
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ELISA PORTAS LTDA', margemX, posY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  posY += 5;
  doc.text('Rua Padre Elio, Nº 30 - Bairro Lama Preta', margemX, posY);
  posY += 4;
  doc.text('Barbacena - MG | (32) 3331-8383', margemX, posY);
  
  // Linha divisória com cor temática
  posY += 5;
  doc.setDrawColor(cor[0], cor[1], cor[2]);
  doc.setLineWidth(1);
  doc.line(margemX, posY, 195, posY);
  
  // Título da ordem com cor temática
  posY += 10;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cor[0], cor[1], cor[2]);
  doc.text(`ORDEM DE ${label}`, 105, posY, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Caixa com informações principais
  posY += 8;
  doc.setDrawColor(cor[0], cor[1], cor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margemX, posY, 180, 28);
  
  posY += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº Ordem: ${data.ordem.numero_ordem}`, margemX + 5, posY);
  
  posY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedido: ${data.pedido.numero_pedido}`, margemX + 5, posY);
  
  posY += 6;
  doc.text(`Cliente: ${data.pedido.cliente_nome}`, margemX + 5, posY);
  
  posY += 6;
  const dataEntrega = data.pedido.data_entrega 
    ? new Date(data.pedido.data_entrega).toLocaleDateString('pt-BR')
    : 'A definir';
  doc.text(`Data Entrega: ${dataEntrega}`, margemX + 5, posY);
  
  posY += 12;
  
  // Informações da Venda
  if (data.venda) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações da Venda', margemX, posY);
    posY += 2;
    
    autoTable(doc, {
      startY: posY,
      margin: { left: margemX, right: margemX },
      head: [['Campo', 'Valor']],
      body: [
        ['Forma de Pagamento', data.venda.forma_pagamento || '-'],
        ['Valor da Venda', data.venda.valor_venda ? formatCurrency(data.venda.valor_venda) : '-'],
      ],
      headStyles: {
        fillColor: [cor[0], cor[1], cor[2]],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 120 },
      },
    });
    
    posY = (doc as any).lastAutoTable.finalY + 8;
  }
  
  // Produtos da Venda
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Produtos da Venda', margemX, posY);
  posY += 2;
  
  const produtosRows = data.produtos.map(p => [
    p.nome_produto || '-',
    p.quantidade.toString(),
    p.tamanho || '-',
  ]);
  
  autoTable(doc, {
    startY: posY,
    margin: { left: margemX, right: margemX },
    head: [['Produto', 'Qtd', 'Tamanho']],
    body: produtosRows,
    headStyles: {
      fillColor: [cor[0], cor[1], cor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50 },
    },
  });
  
  posY = (doc as any).lastAutoTable.finalY + 10;
  
  // Itens desta ordem (DESTAQUE)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cor[0], cor[1], cor[2]);
  doc.text(`ITENS PARA ${label}`, margemX, posY);
  doc.setTextColor(0, 0, 0);
  posY += 2;
  
  const linhasRows = data.linhas.map(l => [
    l.item || '-',
    l.quantidade.toString(),
    l.tamanho || '-',
    l.concluida ? '✓ Concluído' : '⏳ Pendente',
  ]);
  
  autoTable(doc, {
    startY: posY,
    margin: { left: margemX, right: margemX },
    head: [['Item', 'Qtd', 'Tamanho', 'Status']],
    body: linhasRows,
    headStyles: {
      fillColor: [Math.max(0, cor[0] - 30), Math.max(0, cor[1] - 30), Math.max(0, cor[2] - 30)],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      fillColor: [245, 245, 245],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.section === 'body' && data.row.index < linhasRows.length) {
        if (linhasRows[data.row.index][3] === '✓ Concluído') {
          data.cell.styles.fillColor = [200, 230, 201]; // Verde claro
        }
      }
    },
  });
  
  posY = (doc as any).lastAutoTable.finalY + 8;
  
  // Observações
  const observacoes = [
    data.pedido.observacoes ? `Pedido: ${data.pedido.observacoes}` : null,
    data.ordem.observacoes ? `Ordem: ${data.ordem.observacoes}` : null,
  ].filter(Boolean);
  
  if (observacoes.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', margemX, posY);
    posY += 2;
    
    doc.setDrawColor(cor[0], cor[1], cor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margemX, posY, 180, 6 * observacoes.length + 4);
    
    posY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    observacoes.forEach(obs => {
      doc.text(obs!, margemX + 3, posY, { maxWidth: 174 });
      posY += 6;
    });
    
    posY += 4;
  }
  
  // Rodapé
  const finalY = Math.max(posY, 250);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const dataCriacao = new Date(data.ordem.created_at).toLocaleDateString('pt-BR');
  const dataEmissao = new Date().toLocaleString('pt-BR');
  
  doc.text(`Criado em: ${dataCriacao} | Emitido em: ${dataEmissao}`, margemX, finalY);
  doc.text('Elisa Portas - comercial@elisaportas.com.br', margemX, finalY + 4);
  
  return doc;
};

export const baixarOrdemProducaoPDF = (data: OrdemProducaoPDFData) => {
  const doc = gerarOrdemProducaoPDF(data);
  const fileName = `ordem-${data.ordem.tipo_ordem}-${data.ordem.numero_ordem.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  doc.save(fileName);
};
