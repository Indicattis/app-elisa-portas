import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { OrcamentoFormData } from '@/types/orcamento';
import type { OrcamentoProduto } from '@/types/produto';

interface OrcamentoPDFData {
  id?: string;
  formData: OrcamentoFormData;
  produtos: OrcamentoProduto[];
  calculatedTotal: number;
  numeroOrcamento?: string;
  vendedora?: {
    nome: string;
    cargo: string;
  };
}

export const generateOrcamentoPDF = (data: OrcamentoPDFData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 10;
  let yPosition = 15;

  // Configuração de cores
  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  const lightGrayColor = [245, 245, 245] as [number, number, number];
  
  // Configurar fonte padrão como sans-serif
  pdf.setFont('helvetica', 'normal');

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getTipoProdutoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      porta_enrolar: 'Porta de Enrolar',
      porta_social: 'Porta Social',
      acessorio: 'Acessório',
      manutencao: 'Manutenção',
      adicional: 'Adicional'
    };
    return labels[tipo] || tipo;
  };

  // Logo da empresa
  try {
    pdf.addImage('/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png', 'PNG', margin, yPosition - 20, 60, 25);
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
  pdf.setLineWidth(0.2);
  pdf.line(margin, yPosition + 18, pageWidth - margin, yPosition + 18);
  
  yPosition += 25;

  // Título do documento e número
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ORÇAMENTO', margin, yPosition);
  
  const numeroOrcamento = data.numeroOrcamento || `ORC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nº: ${numeroOrcamento}`, pageWidth - margin - 60, yPosition);
  pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 60, yPosition + 6);
  
  yPosition += 15;

  // Dados do cliente com fundo destacado
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO CLIENTE', margin, yPosition);
  yPosition += 10;

  // Fundo cinza claro para a seção do cliente
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition - 3, pageWidth - (margin * 2), 30, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Nome: ${data.formData.cliente_nome || 'Não informado'}`, margin + 3, yPosition + 3);
  pdf.text(`CPF: ${data.formData.cliente_cpf || 'Não informado'}`, margin + 3, yPosition + 9);
  pdf.text(`Telefone: ${data.formData.cliente_telefone || 'Não informado'}`, margin + 3, yPosition + 15);
  
  pdf.text(`Estado: ${data.formData.cliente_estado || 'Não informado'}`, pageWidth/2, yPosition + 3);
  pdf.text(`Cidade: ${data.formData.cliente_cidade || 'Não informado'}`, pageWidth/2, yPosition + 9);
  pdf.text(`CEP: ${data.formData.cliente_cep || 'Não informado'}`, pageWidth/2, yPosition + 15);
  
  yPosition += 35;

  // Informações da vendedora
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VENDEDORA RESPONSÁVEL', margin, yPosition);
  yPosition += 10;

  // Adicionar avatar placeholder (substituir pela imagem real quando disponível)
  try {
    pdf.addImage('/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png', 'PNG', margin, yPosition, 20, 20);
  } catch (error) {
    // Fallback para círculo se a imagem não carregar
    pdf.setFillColor(200, 200, 200);
    pdf.circle(margin + 10, yPosition + 10, 10, 'F');
  }

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.vendedora?.nome || 'Consultora de Vendas'}`, margin + 25, yPosition + 8);
  pdf.text(`${data.vendedora?.cargo || 'Departamento Comercial'}`, margin + 25, yPosition + 14);
  
  yPosition += 35;

  // Produtos
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTOS E SERVIÇOS', margin, yPosition);
  yPosition += 10;

  if (data.produtos.length > 0) {
    // Preparar dados da tabela
    const tableData = data.produtos.map(produto => {
      let descricao = getTipoProdutoLabel(produto.tipo_produto);
      
      if (produto.medidas) {
        descricao += `\nMedidas: ${produto.medidas}`;
      }
      
      if (produto.descricao) {
        descricao += `\n${produto.descricao}`;
      }
      
      if (produto.descricao_manutencao) {
        descricao += `\n${produto.descricao_manutencao}`;
      }

      const quantidade = 1; // Por padrão 1 unidade, pode ser modificado conforme necessário
      const precoUnitario = produto.valor;
      const desconto = produto.desconto_percentual || 0;
      const precoFinal = precoUnitario - (precoUnitario * desconto / 100);

      return [
        descricao,
        quantidade.toString(),
        formatCurrency(precoUnitario),
        desconto > 0 ? `${desconto}%` : '-',
        formatCurrency(precoFinal)
      ];
    });

    // Adicionar serviços adicionais
    if (parseFloat(data.formData.valor_frete) > 0) {
      const freteValue = parseFloat(data.formData.valor_frete);
      tableData.push(['Frete', '1', formatCurrency(freteValue), '-', formatCurrency(freteValue)]);
    }

    autoTable(pdf, {
      head: [['Produto', 'Un.', 'Valor', 'Desconto', 'Valor final']],
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
      tableWidth: 'auto',
      columnStyles: {
        0: { halign: 'left' },     // Produto
        1: { halign: 'center' },   // QTD
        2: { halign: 'right' },    // Preço
        3: { halign: 'center' },   // Desconto
        4: { halign: 'right' }     // Preço Final
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 20;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum produto adicionado', margin, yPosition);
    yPosition += 20;
  }

  // Resumo
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Quantidade de itens - alinhado à direita máxima
  pdf.text('Quantidade de itens:', margin, yPosition);
  const qtyText = data.produtos.length.toString();
  const qtyTextWidth = pdf.getTextWidth(qtyText);
  pdf.text(qtyText, pageWidth - margin - qtyTextWidth, yPosition);
  yPosition += 8;

  // Desconto se houver - alinhado à direita máxima
  if (data.formData.desconto_total_percentual > 0) {
    const subtotal = data.calculatedTotal / (1 - data.formData.desconto_total_percentual / 100);
    const desconto = subtotal - data.calculatedTotal;
    
    pdf.text('Subtotal:', margin, yPosition);
    const subtotalText = formatCurrency(subtotal);
    const subtotalTextWidth = pdf.getTextWidth(subtotalText);
    pdf.text(subtotalText, pageWidth - margin - subtotalTextWidth, yPosition);
    yPosition += 8;
    
    pdf.setTextColor(0, 150, 0); // Verde para desconto
    pdf.text(`Desconto (${data.formData.desconto_total_percentual}%):`, margin, yPosition);
    const descontoText = `-${formatCurrency(desconto)}`;
    const descontoTextWidth = pdf.getTextWidth(descontoText);
    pdf.text(descontoText, pageWidth - margin - descontoTextWidth, yPosition);
    yPosition += 8;
    pdf.setTextColor(0, 0, 0); // Voltar para preto
  }

  // Linha antes do total
  pdf.setDrawColor(...grayColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Total - alinhado à direita máxima
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('TOTAL:', margin, yPosition);
  const totalText = formatCurrency(data.calculatedTotal);
  const totalTextWidth = pdf.getTextWidth(totalText);
  pdf.text(totalText, pageWidth - margin - totalTextWidth, yPosition);
  
  yPosition += 25;

  // Verificar se há espaço suficiente para informações de pagamento
  // const remainingSpace = pdf.internal.pageSize.height - yPosition - 60; // 60 para o rodapé
  
  // if (remainingSpace < 30) {
  //   pdf.addPage();
  //   yPosition = 30;
  // }

  // Informações de pagamento
  // pdf.setFontSize(11);
  // pdf.setFont('helvetica', 'normal');
  // pdf.text(`Forma de Pagamento: ${data.formData.forma_pagamento || 'Não informado'}`, margin, yPosition);
  // yPosition += 6;
  
  // const modalidade = data.formData.modalidade_instalacao === 'instalacao_elisa' ? 'Instalação Elisa' : 'Autorizado Elisa';
  // pdf.text(`Modalidade de Instalação: ${modalidade}`, margin, yPosition);
  
  // Rodapé sempre no final da página
  yPosition = pdf.internal.pageSize.height - 10;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Este orçamento tem validade de 30 dias.', margin, yPosition);
  pdf.text('Elisa Portas LTDA - Soluções em Portas de Aço', margin, yPosition + 6);
  pdf.text('Contato: contato@elisaportas.com.br', margin, yPosition + 12);

  // Salvar o PDF
  const fileName = `orcamento-${numeroOrcamento}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};