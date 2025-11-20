import jsPDF from 'jspdf';
import { ContratoVariaveis } from '@/types/contrato';
import { substituirVariaveis } from '@/hooks/useContratoVariaveis';

interface ContratoPDFData {
  template: string;
  variaveis: ContratoVariaveis;
  numeroContrato: string;
}

export const generateContratoPDF = (data: ContratoPDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // === HEADER (PADRÃO) ===
  const addHeader = () => {
    // Logo placeholder (pode ser substituído por logo real)
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, currentY, 30, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ELISA', margin + 15, currentY + 8, { align: 'center' });
    
    // Informações da empresa
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const infoX = margin + 35;
    doc.text('ELISA PORTAS E ACESSÓRIOS LTDA', infoX, currentY + 3);
    doc.text('CNPJ: 00.000.000/0001-00', infoX, currentY + 7);
    doc.text('Endereço da empresa - Cidade/UF - CEP: 00000-000', infoX, currentY + 11);
    
    currentY += 20;
    
    // Título do contrato
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('CONTRATO DE COMPRA E VENDA', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
    
    // Número e data
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Contrato Nº: ${data.numeroContrato}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text(`Data: ${data.variaveis.data_geracao}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  };

  // === FOOTER (PADRÃO) ===
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Informações de contato
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('www.elisaportas.com.br | contato@elisaportas.com.br | (00) 0000-0000', pageWidth / 2, footerY, { align: 'center' });
    
    // Número da página
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // Adicionar header inicial
  addHeader();

  // === CONTEÚDO DO TEMPLATE ===
  const conteudoProcessado = substituirVariaveis(data.template, data.variaveis);
  const linhas = conteudoProcessado.split('\n');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  linhas.forEach(linha => {
    // Verificar se precisa de nova página
    if (currentY > pageHeight - 40) {
      addFooter(doc.getCurrentPageInfo().pageNumber, 1); // Será atualizado depois
      doc.addPage();
      currentY = margin;
      addHeader();
    }

    // Processar linha (quebrar se muito longa)
    if (linha.trim()) {
      const linhasQuebradas = doc.splitTextToSize(linha, maxWidth);
      linhasQuebradas.forEach((linhaQuebrada: string) => {
        if (currentY > pageHeight - 40) {
          addFooter(doc.getCurrentPageInfo().pageNumber, 1);
          doc.addPage();
          currentY = margin;
          addHeader();
        }
        doc.text(linhaQuebrada, margin, currentY);
        currentY += 6;
      });
    } else {
      currentY += 4; // Espaço para linha vazia
    }
  });

  // === SEÇÃO DE ASSINATURAS (PADRÃO) ===
  const addSignatures = () => {
    // Verificar espaço para assinaturas
    if (currentY > pageHeight - 80) {
      addFooter(doc.getCurrentPageInfo().pageNumber, 1);
      doc.addPage();
      currentY = margin;
    }

    currentY += 15;

    // Título da seção
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('ASSINATURAS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Assinatura do Cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const col1X = margin + 10;
    const col2X = pageWidth / 2 + 10;
    const signatureY = currentY;

    // Cliente
    doc.text('CONTRATANTE:', col1X, signatureY);
    doc.line(col1X, signatureY + 15, col1X + 70, signatureY + 15);
    doc.setFontSize(9);
    doc.text(data.variaveis.cliente_nome, col1X, signatureY + 20);
    doc.text(`CPF: ${data.variaveis.cliente_cpf || '___.___.___-__'}`, col1X, signatureY + 25);
    doc.text(`Data: ___/___/_____`, col1X, signatureY + 30);

    // Empresa
    doc.setFontSize(10);
    doc.text('CONTRATADA:', col2X, signatureY);
    doc.line(col2X, signatureY + 15, col2X + 70, signatureY + 15);
    doc.setFontSize(9);
    doc.text(data.variaveis.empresa_nome, col2X, signatureY + 20);
    doc.text(`CNPJ: ${data.variaveis.empresa_cnpj}`, col2X, signatureY + 25);
    doc.text(`Data: ___/___/_____`, col2X, signatureY + 30);
  };

  addSignatures();

  // Atualizar todos os footers com número correto de páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Salvar PDF
  const fileName = `contrato_${data.numeroContrato}_${Date.now()}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
