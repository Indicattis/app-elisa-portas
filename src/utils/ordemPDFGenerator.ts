import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ItemOrdem {
  item: string;
  quantidade: number;
  medidas: string;
}

interface DadosPedido {
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
}

export const gerarPDFOrdem = (
  tipoOrdem: string,
  items: ItemOrdem[],
  dadosPedido: DadosPedido
) => {
  const doc = new jsPDF();
  
  // Configurações
  const margemX = 20;
  let posY = 20;
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`ORDEM DE ${tipoOrdem.toUpperCase()}`, margemX, posY);
  
  posY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedido: ${dadosPedido.numero_pedido}`, margemX, posY);
  
  posY += 10;
  doc.text(`Cliente: ${dadosPedido.cliente_nome}`, margemX, posY);
  
  if (dadosPedido.cliente_telefone) {
    posY += 7;
    doc.text(`Telefone: ${dadosPedido.cliente_telefone}`, margemX, posY);
  }
  
  // Endereço
  const endereco = [
    dadosPedido.endereco_rua,
    dadosPedido.endereco_numero,
    dadosPedido.endereco_cidade,
    dadosPedido.endereco_estado
  ].filter(Boolean).join(', ');
  
  if (endereco) {
    posY += 7;
    doc.text(`Endereço: ${endereco}`, margemX, posY);
  }
  
  posY += 20;
  
  // Tabela de itens
  const tableColumns = ['Item', 'Quantidade', 'Medidas'];
  const tableRows = items.map(item => [
    item.item,
    item.quantidade.toString(),
    item.medidas
  ]);
  
  (doc as any).autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: posY,
    margin: { horizontal: margemX },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Rodapé
  const finalY = (doc as any).lastAutoTable?.finalY || posY + 50;
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margemX, finalY + 20);
  
  // Campos para assinatura
  doc.setFontSize(12);
  doc.text('Responsável pela execução:', margemX, finalY + 40);
  doc.line(margemX + 60, finalY + 40, margemX + 120, finalY + 40);
  
  doc.text('Data de conclusão:', margemX, finalY + 55);
  doc.line(margemX + 45, finalY + 55, margemX + 90, finalY + 55);
  
  doc.text('Assinatura:', margemX + 100, finalY + 55);
  doc.line(margemX + 125, finalY + 55, margemX + 170, finalY + 55);
  
  return doc;
};

export const baixarPDFOrdem = (
  tipoOrdem: string,
  items: ItemOrdem[],
  dadosPedido: DadosPedido
) => {
  const doc = gerarPDFOrdem(tipoOrdem, items, dadosPedido);
  doc.save(`ordem-${tipoOrdem}-${dadosPedido.numero_pedido}.pdf`);
};