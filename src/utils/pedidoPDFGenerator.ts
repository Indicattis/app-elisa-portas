import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto_tipo: string;
  produto_cor: string;
  status: string;
  created_at: string;
  data_entrega: string;
  observacoes: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
  produto_largura: string;
  produto_altura: string;
  venda_id: string;
}

interface VendaData {
  forma_pagamento?: string;
  valor_venda?: number;
  valor_entrada?: number;
  numero_parcelas?: number;
  observacoes_venda?: string;
}

interface PedidoPDFData {
  pedido: Pedido;
  vendaData?: VendaData | null;
}

export const generatePedidoPDF = (data: PedidoPDFData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 10;
  let yPosition = 15;

  // Configuração de cores
  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  
  // Configurar fonte padrão como sans-serif
  pdf.setFont('helvetica', 'normal');

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Logo da empresa
  try {
    pdf.addImage('/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png', 'PNG', margin, yPosition - 10, 60, 25);
  } catch (error) {
    // Fallback para texto se a imagem não carregar
    pdf.setFontSize(20);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELISA PORTAS LTDA', margin, yPosition);
    
    pdf.setFontSize(12);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text('A maior fábrica de portas de enrolar do Sul do país', margin, yPosition + 8);
  }

  // Informações da empresa no canto direito
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

  // Título do documento e número
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('#PEDIDO DE PRODUÇÃO', margin, yPosition);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nº: ${data.pedido.numero_pedido}`, 70, yPosition);
  pdf.text(`Data: ${new Date(data.pedido.created_at).toLocaleDateString('pt-BR')}`, pageWidth - margin - 60, yPosition);
  
  yPosition += 10;

  // Dados do cliente com fundo destacado
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dados do cliente', margin, yPosition);
  yPosition += 10;

  // Fundo cinza claro para a seção do cliente
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition - 3, pageWidth - (margin * 2), 30, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Nome: ${data.pedido.cliente_nome}`, margin + 3, yPosition + 3);
  pdf.text(`Telefone: ${data.pedido.cliente_telefone || 'Não informado'}`, margin + 3, yPosition + 9);
  
  const endereco = `${data.pedido.endereco_rua || ''}, ${data.pedido.endereco_numero || ''} - ${data.pedido.endereco_bairro || ''}`;
  pdf.text(`Endereço: ${endereco}`, margin + 3, yPosition + 15);
  
  pdf.text(`Estado: ${data.pedido.endereco_estado || 'Não informado'}`, pageWidth/2, yPosition + 3);
  pdf.text(`Cidade: ${data.pedido.endereco_cidade || 'Não informado'}`, pageWidth/2, yPosition + 9);
  pdf.text(`CEP: ${data.pedido.endereco_cep || 'Não informado'}`, pageWidth/2, yPosition + 15);
  
  yPosition += 40;

  // Especificações do produto
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Especificações do Produto', margin, yPosition);
  yPosition += 10;

  const produtoData = [
    ['Tipo de Produto', data.pedido.produto_tipo],
    ['Dimensões', `${data.pedido.produto_largura} x ${data.pedido.produto_altura}`],
    ['Cor', data.pedido.produto_cor],
    ['Data de Entrega', data.pedido.data_entrega ? new Date(data.pedido.data_entrega).toLocaleDateString('pt-BR') : 'A definir'],
  ];

  autoTable(pdf, {
    body: produtoData,
    startY: yPosition,
    styles: { 
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { halign: 'left' }
    },
    margin: { left: margin, right: margin },
    theme: 'plain'
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 20;

  // Forma de pagamento (se disponível)
  if (data.vendaData) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informações de pagamento', margin, yPosition);
    yPosition += 10;

    const pagamentoData = [];
    
    if (data.vendaData.forma_pagamento) {
      pagamentoData.push(['Forma de Pagamento', data.vendaData.forma_pagamento]);
    }
    
    if (data.vendaData.valor_venda) {
      pagamentoData.push(['Valor da Venda', formatCurrency(data.vendaData.valor_venda)]);
    }
    
    if (data.vendaData.valor_entrada) {
      pagamentoData.push(['Valor de Entrada', formatCurrency(data.vendaData.valor_entrada)]);
    }
    
    if (data.vendaData.numero_parcelas) {
      pagamentoData.push(['Número de Parcelas', data.vendaData.numero_parcelas.toString()]);
    }

    if (pagamentoData.length > 0) {
      autoTable(pdf, {
        body: pagamentoData,
        startY: yPosition,
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', fillColor: [245, 245, 245] },
          1: { halign: 'left' }
        },
        margin: { left: margin, right: margin },
        theme: 'plain'
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;
    }
  }

  // Detalhamento do pedido
  if (data.pedido.observacoes) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detalhamento do Pedido', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Quebrar texto em linhas
    const lines = pdf.splitTextToSize(data.pedido.observacoes, pageWidth - (margin * 2));
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Observações da venda (se disponível)
  if (data.vendaData?.observacoes_venda) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observações da Venda', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Quebrar texto em linhas
    const lines = pdf.splitTextToSize(data.vendaData.observacoes_venda, pageWidth - (margin * 2));
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Rodapé
  yPosition = pdf.internal.pageSize.height - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, yPosition);
  pdf.text('Contato: comercial@elisaportas.com.br', margin, yPosition + 6);

  // Salvar o PDF
  const fileName = `pedido-${data.pedido.numero_pedido.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  pdf.save(fileName);
};