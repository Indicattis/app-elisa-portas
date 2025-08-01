import jsPDF from 'jspdf';
import type { OrcamentoProduto } from '@/types/produto';

interface OrcamentoPDFData {
  id: string;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
    cidade?: string;
  };
  produtos: OrcamentoProduto[];
  valor_pintura: number;
  valor_frete: number;
  valor_instalacao: number;
  valor_total: number;
  desconto_percentual: number;
  forma_pagamento: string;
  data_criacao: string;
}

export const generateOrcamentoPDF = (data: OrcamentoPDFData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Configuração de cores
  const primaryColor = [41, 128, 185] as [number, number, number]; // Azul
  const grayColor = [128, 128, 128] as [number, number, number];
  const lightGrayColor = [245, 245, 245] as [number, number, number];

  // Cabeçalho da empresa
  pdf.setFontSize(24);
  pdf.setTextColor(...primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELISAPORTAS', margin, yPosition);
  
  pdf.setFontSize(12);
  pdf.setTextColor(...grayColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Soluções em Portas de Aço', margin, yPosition + 8);
  
  // Linha divisória
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(1);
  pdf.line(margin, yPosition + 15, pageWidth - margin, yPosition + 15);
  
  yPosition += 30;

  // Título do documento
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ORÇAMENTO', margin, yPosition);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nº: ${data.id.slice(-8).toUpperCase()}`, pageWidth - margin - 50, yPosition);
  pdf.text(`Data: ${data.data_criacao}`, pageWidth - margin - 50, yPosition + 6);
  
  yPosition += 25;

  // Dados do cliente
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO CLIENTE', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome: ${data.cliente.nome}`, margin, yPosition);
  pdf.text(`Telefone: ${data.cliente.telefone}`, margin, yPosition + 6);
  
  if (data.cliente.email) {
    pdf.text(`Email: ${data.cliente.email}`, margin, yPosition + 12);
    yPosition += 6;
  }
  
  if (data.cliente.cidade) {
    pdf.text(`Cidade: ${data.cliente.cidade}`, margin, yPosition + 12);
    yPosition += 6;
  }
  
  yPosition += 25;

  // Produtos
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTOS E SERVIÇOS', margin, yPosition);
  yPosition += 15;

  // Cabeçalho da tabela de produtos
  pdf.setFillColor(...lightGrayColor);
  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIÇÃO', margin + 5, yPosition);
  pdf.text('VALOR', pageWidth - margin - 30, yPosition);
  
  yPosition += 10;

  // Lista de produtos
  pdf.setFont('helvetica', 'normal');
  data.produtos.forEach((produto) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }

    let descricao = '';
    switch (produto.tipo_produto) {
      case 'porta_enrolar':
        descricao = 'Porta de Enrolar';
        break;
      case 'porta_social':
        descricao = 'Porta Social';
        break;
      case 'acessorio':
        descricao = 'Acessório';
        break;
      case 'manutencao':
        descricao = 'Manutenção';
        break;
      case 'adicional':
        descricao = 'Adicional';
        break;
    }

    pdf.text(descricao, margin + 5, yPosition);
    pdf.text(`R$ ${produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 6;

    if (produto.medidas) {
      pdf.setFontSize(9);
      pdf.setTextColor(...grayColor);
      pdf.text(`Medidas: ${produto.medidas}`, margin + 10, yPosition);
      yPosition += 5;
    }

    if (produto.cor) {
      pdf.setFontSize(9);
      pdf.setTextColor(...grayColor);
      pdf.text(`Cor: ${produto.cor}`, margin + 10, yPosition);
      yPosition += 5;
    }

    pdf.setFontSize(9);
    pdf.setTextColor(...grayColor);
    pdf.text(`${produto.descricao}`, margin + 10, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
  });

  // Serviços adicionais
  yPosition += 10;
  
  if (data.valor_pintura > 0) {
    pdf.text('Pintura', margin + 5, yPosition);
    pdf.text(`R$ ${data.valor_pintura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 8;
  }

  if (data.valor_frete > 0) {
    pdf.text('Frete', margin + 5, yPosition);
    pdf.text(`R$ ${data.valor_frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 8;
  }

  if (data.valor_instalacao > 0) {
    pdf.text('Instalação', margin + 5, yPosition);
    pdf.text(`R$ ${data.valor_instalacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 8;
  }

  // Linha antes do total
  yPosition += 5;
  pdf.setDrawColor(...grayColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Total
  if (data.desconto_percentual > 0) {
    const valorSemDesconto = data.valor_total / (1 - data.desconto_percentual / 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal:', pageWidth - margin - 80, yPosition);
    pdf.text(`R$ ${valorSemDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 8;

    pdf.setTextColor(...primaryColor);
    pdf.text(`Desconto (${data.desconto_percentual}%):`, pageWidth - margin - 80, yPosition);
    pdf.text(`-R$ ${(valorSemDesconto - data.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', pageWidth - margin - 80, yPosition);
  pdf.text(`R$ ${data.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 30, yPosition);
  
  yPosition += 20;

  // Forma de pagamento
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Forma de Pagamento: ${data.forma_pagamento}`, margin, yPosition);
  
  // Rodapé
  yPosition = pdf.internal.pageSize.height - 40;
  pdf.setFontSize(9);
  pdf.setTextColor(...grayColor);
  pdf.text('Este orçamento tem validade de 30 dias.', margin, yPosition);
  pdf.text('Elisaportas - Soluções em Portas de Aço', margin, yPosition + 6);
  pdf.text('Contato: (11) 99999-9999 | contato@elisaportas.com.br', margin, yPosition + 12);

  // Salvar o PDF
  try {
    pdf.save(`orcamento-${data.id.slice(-8)}.pdf`);
    console.log("PDF gerado com sucesso");
  } catch (error) {
    console.error("Erro ao salvar PDF:", error);
    throw error;
  }
};