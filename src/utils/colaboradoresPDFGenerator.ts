import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROLE_LABELS } from '@/types/permissions';

interface ColaboradorPDF {
  nome: string;
  email: string;
  cpf: string | null;
  role: string;
  setor: string | null;
  salario: number | null;
  modalidade_pagamento: "mensal" | "diaria" | null;
  em_folha: boolean | null;
}

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatCPF = (cpf: string | null): string => {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const gerarColaboradoresPDF = (colaboradores: ColaboradorPDF[]) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape for more columns
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 10;
  let yPosition = 15;

  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];

  pdf.setFont('helvetica', 'normal');

  // Logo
  try {
    pdf.addImage('/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png', 'PNG', margin, yPosition - 10, 60, 25);
  } catch {
    pdf.setFontSize(20);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELISA PORTAS LTDA', margin, yPosition);
    pdf.setFontSize(12);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text('A maior fábrica de portas de enrolar do Sul do país', margin, yPosition + 8);
  }

  // Company info
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  const empresaInfo = ['Rua Padre Elio Baron Toaldo, 571', '95055652 - Caxias do Sul, RS', 'CNPJ: 59.277.825/0001-09'];
  empresaInfo.forEach((info, i) => pdf.text(info, pageWidth - margin - 60, yPosition + i * 5));

  pdf.setDrawColor(...grayColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition + 15, pageWidth - margin, yPosition + 15);
  yPosition += 25;

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO DE COLABORADORES', margin, yPosition);

  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition + 8);
  yPosition += 20;

  // Table data
  const tableData = colaboradores.map(c => [
    c.nome,
    c.email,
    formatCPF(c.cpf),
    ROLE_LABELS[c.role as keyof typeof ROLE_LABELS] || c.role,
    c.setor || '-',
    formatCurrency(c.salario),
    c.modalidade_pagamento === 'mensal' ? 'Mensal' : c.modalidade_pagamento === 'diaria' ? 'Diária' : '-',
    c.em_folha ? 'Sim' : 'Não',
  ]);

  autoTable(pdf, {
    head: [['Nome', 'Email', 'CPF', 'Função', 'Setor', 'Salário', 'Modalidade', 'Em Folha']],
    body: tableData,
    startY: yPosition,
    styles: { fontSize: 7, cellPadding: 2, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.3 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    theme: 'striped',
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'Sim') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Summary
  const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 100;
  let resumoY = finalY + 15;
  if (resumoY + 60 > pageHeight - 20) { pdf.addPage(); resumoY = 20; }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Resumo Estatístico:', margin, resumoY);
  resumoY += 8;

  const total = colaboradores.length;
  const setorCount: Record<string, number> = {};
  const funcaoCount: Record<string, number> = {};
  colaboradores.forEach(c => {
    setorCount[c.setor || 'sem_setor'] = (setorCount[c.setor || 'sem_setor'] || 0) + 1;
    funcaoCount[c.role] = (funcaoCount[c.role] || 0) + 1;
  });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`• Total de colaboradores: ${total}`, margin, resumoY);
  resumoY += 8;

  pdf.text('• Distribuição por setor:', margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  Object.entries(setorCount).forEach(([setor, count]) => {
    pdf.text(`  - ${setor === 'sem_setor' ? 'Sem setor' : setor}: ${count}`, margin + 5, resumoY);
    resumoY += 5;
  });
  resumoY += 3;

  pdf.setFontSize(10);
  pdf.text('• Distribuição por função:', margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  Object.entries(funcaoCount).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
    pdf.text(`  - ${ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}: ${count}`, margin + 5, resumoY);
    resumoY += 5;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, pageHeight - 15);
  pdf.text('Contato: comercial@elisaportas.com.br', margin, pageHeight - 10);

  const fileName = `relatorio-colaboradores-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  pdf.save(fileName);
};
