import jsPDF from 'jspdf';
import { EtiquetaCalculo, TagIndividual, TagProducao } from '@/types/etiqueta';
import logoEtiqueta from '@/assets/logo-etiqueta.png';

interface TagData {
  nomeProduto: string;
  numeroPedido: string;
  quantidade: number;
  largura?: number;
  altura?: number;
  tagNumero: number;
  totalTags: number;
}

// A4 dimensions in points (72 points = 1 inch, A4 = 210mm x 297mm)
const A4_WIDTH = 595.28; // 210mm
const A4_HEIGHT = 841.89; // 297mm

// Layout configuration
const MARGIN = 28.35; // 10mm
const GAP = 14.17; // 5mm
const COLUMNS = 3;
const TAG_HEIGHT = 100; // 100px ≈ 35mm

// Calculate tag width (30% of usable width)
const USABLE_WIDTH = A4_WIDTH - (2 * MARGIN);
const TAG_WIDTH = (USABLE_WIDTH - (2 * GAP)) / COLUMNS;

// Calculate tags per page
const USABLE_HEIGHT = A4_HEIGHT - (2 * MARGIN);
const TAGS_PER_COLUMN = Math.floor(USABLE_HEIGHT / (TAG_HEIGHT + GAP));
const TAGS_PER_PAGE = COLUMNS * TAGS_PER_COLUMN;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function drawTag(
  doc: jsPDF,
  tag: TagData,
  x: number,
  y: number
): void {
  // Draw border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(x, y, TAG_WIDTH, TAG_HEIGHT);

  // Padding
  const px = x + 8;
  const py = y + 12;

  // Product name (bold, larger)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const truncatedName = truncateText(tag.nomeProduto, 35);
  doc.text(truncatedName, px, py);

  // Order number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedido: ${tag.numeroPedido}`, px, py + 18);

  // Quantity
  doc.setFontSize(9);
  doc.text(`Qtd: ${tag.quantidade} unidade${tag.quantidade !== 1 ? 's' : ''}`, px, py + 30);

  // Dimensions (if available)
  if (tag.largura && tag.altura) {
    const dimensoes = `Dimensões: ${tag.largura}m x ${tag.altura}m`;
    doc.text(dimensoes, px, py + 42);
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Sem dimensões', px, py + 42);
    doc.setTextColor(0, 0, 0);
  }

  // Tag counter (bottom, gray)
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  if (tag.totalTags > 1) {
    doc.text(`Etiqueta ${tag.tagNumero} de ${tag.totalTags}`, px, py + TAG_HEIGHT - 20);
  }
  doc.setTextColor(0, 0, 0);
}

function calculateTagPosition(index: number): { x: number; y: number; page: number } {
  const pageIndex = Math.floor(index / TAGS_PER_PAGE);
  const indexInPage = index % TAGS_PER_PAGE;
  
  const column = indexInPage % COLUMNS;
  const row = Math.floor(indexInPage / COLUMNS);

  const x = MARGIN + (column * (TAG_WIDTH + GAP));
  const y = MARGIN + (row * (TAG_HEIGHT + GAP));

  return { x, y, page: pageIndex };
}

export function gerarPDFEtiquetas(
  calculos: EtiquetaCalculo[],
  numeroPedido: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // Generate all tags data
  const allTags: TagData[] = [];
  
  calculos.forEach((calculo) => {
    const numEtiquetas = calculo.etiquetasNecessarias;
    
    for (let i = 1; i <= numEtiquetas; i++) {
      allTags.push({
        nomeProduto: calculo.nomeProduto,
        numeroPedido,
        quantidade: calculo.quantidade,
        largura: calculo.largura,
        altura: calculo.altura,
        tagNumero: i,
        totalTags: numEtiquetas
      });
    }
  });

  // Draw all tags
  let currentPage = 0;
  
  allTags.forEach((tag, index) => {
    const { x, y, page } = calculateTagPosition(index);
    
    // Add new page if needed
    if (page > currentPage) {
      doc.addPage();
      currentPage = page;
    }
    
    drawTag(doc, tag, x, y);
  });

  // Add footer with metadata
  const totalPages = currentPage + 1;
  for (let i = 0; i < totalPages; i++) {
    doc.setPage(i + 1);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pedido ${numeroPedido} - Página ${i + 1} de ${totalPages} - Total: ${allTags.length} etiqueta${allTags.length !== 1 ? 's' : ''}`,
      MARGIN,
      A4_HEIGHT - 15
    );
  }

  return doc;
}

export function gerarPDFEtiquetaIndividual(tag: TagIndividual): jsPDF {
  // 80px width x 60px height ≈ 28.22mm x 21.17mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [21.17, 28.22] // [height, width]
  });

  // Padding (2mm internal)
  const px = 2;
  const py = 2;

  // Product name (8pt, bold)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const truncatedName = truncateText(tag.nomeProduto, 25);
  doc.text(truncatedName, px, py + 3);

  // Order number (6pt)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedido: ${tag.numeroPedido}`, px, py + 7);

  // Quantity (6pt)
  doc.text(`Qtd: ${tag.quantidade}`, px, py + 10.5);

  // Dimensions (6pt)
  if (tag.largura && tag.altura) {
    doc.text(`${tag.largura}m x ${tag.altura}m`, px, py + 14);
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('N/A', px, py + 14);
    doc.setTextColor(0, 0, 0);
  }

  // Tag counter (5pt, gray, bottom)
  doc.setFontSize(5);
  doc.setTextColor(120, 120, 120);
  if (tag.totalTags > 1) {
    doc.text(`${tag.tagNumero}/${tag.totalTags}`, px, py + 18);
  }

  return doc;
}

export function getTotalEtiquetas(calculos: EtiquetaCalculo[]): number {
  return calculos.reduce((total, calculo) => total + calculo.etiquetasNecessarias, 0);
}

// Função auxiliar para desenhar uma etiqueta de produção
function desenharEtiquetaProducao(doc: jsPDF, tag: TagProducao, pageWidth: number, pageHeight: number): void {
  // Header com fundo transparente
  const headerHeight = 104;
  
  // Logo (centralizada no header)
  try {
    const logoWidth = 300;
    const logoHeight = 90;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 7;
    doc.addImage(logoEtiqueta, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    // Se logo não disponível, usar texto preto centralizado
    doc.setFontSize(80);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ELISA PORTAS', pageWidth / 2, 65, { align: 'center' });
  }
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Content area centralizado
  let currentY = 154;
  const lineSpacing = 50; // Reduzido de 65 para 50

  // Cliente
  if (tag.clienteNome) {
    doc.setFontSize(64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    const truncatedCliente = truncateText(tag.clienteNome, 60);
    doc.text(`CLIENTE: ${truncatedCliente}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += lineSpacing;
  }

  // Product name
  doc.setFontSize(84);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const truncatedName = truncateText(tag.nomeProduto, 60);
  doc.text(`PRODUTO: ${truncatedName}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += lineSpacing;

  // Tamanho da porta (informação do cadastro)
  if (tag.tamanho) {
    doc.setFontSize(76);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`TAMANHO: ${tag.tamanho}m`, pageWidth / 2, currentY, { align: 'center' });
    currentY += lineSpacing;
  }

  // Dimensions (medidas exatas)
  if (tag.largura && tag.altura) {
    doc.setFontSize(76);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`DIMENSÕES: ${tag.largura}m x ${tag.altura}m`, pageWidth / 2, currentY, { align: 'center' });
    currentY += lineSpacing;
  }

  // Cor/Pintura
  if (tag.corNome || tag.tipoPintura) {
    doc.setFontSize(76);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const pinturaTexto = [tag.corNome, tag.tipoPintura].filter(Boolean).join(' - ');
    doc.text(`PINTURA: ${pinturaTexto || 'Sem pintura'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += lineSpacing;
  }

  // Quantity
  doc.setFontSize(76);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`QUANTIDADE: ${tag.quantidade} unidade${tag.quantidade !== 1 ? 's' : ''}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += lineSpacing;

  // Order number
  doc.setFontSize(76);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`PEDIDO: ${tag.numeroPedido}`, pageWidth / 2, currentY, { align: 'center' });
}

export function gerarPDFEtiquetaProducao(tag: TagProducao): jsPDF {
  // 800mm width x 400mm height (80cm x 40cm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [400, 800] // [height, width]
  });

  const pageWidth = 800;
  const pageHeight = 400;
  
  desenharEtiquetaProducao(doc, tag, pageWidth, pageHeight);

  return doc;
}

export function gerarPDFEtiquetasProducaoMultiplas(tags: TagProducao[]): jsPDF {
  if (tags.length === 0) {
    throw new Error('Nenhuma etiqueta para gerar');
  }

  // 800mm width x 400mm height (80cm x 40cm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [400, 800] // [height, width]
  });

  const pageWidth = 800;
  const pageHeight = 400;

  // Desenhar primeira etiqueta
  desenharEtiquetaProducao(doc, tags[0], pageWidth, pageHeight);

  // Adicionar páginas para as demais etiquetas
  for (let i = 1; i < tags.length; i++) {
    doc.addPage([400, 800]);
    desenharEtiquetaProducao(doc, tags[i], pageWidth, pageHeight);
  }

  return doc;
}
