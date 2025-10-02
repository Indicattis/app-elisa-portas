import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstalacaoCadastrada {
  id: string;
  nome_cliente: string;
  telefone_cliente?: string | null;
  cidade: string;
  estado: string;
  categoria: 'instalacao' | 'entrega' | 'correcao';
  status: 'pendente_producao' | 'pronta_fabrica' | 'finalizada';
  tamanho?: string | null;
  data_instalacao?: string | null;
  responsavel_instalacao_nome?: string | null;
  criador?: {
    nome: string;
    foto_perfil_url?: string;
  };
  created_at: string;
}

interface InstalacoesPDFData {
  instalacoes: InstalacaoCadastrada[];
}

const getCategoriaLabel = (categoria: string) => {
  switch (categoria) {
    case 'instalacao': return 'Instalação';
    case 'entrega': return 'Entrega';
    case 'correcao': return 'Correção';
    default: return categoria;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pendente_producao': return 'Pendente Produção';
    case 'pronta_fabrica': return 'Pronta na Fábrica';
    case 'finalizada': return 'Finalizada';
    default: return status;
  }
};

const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'finalizada': return [22, 163, 74]; // green
    case 'pronta_fabrica': return [37, 99, 235]; // blue
    case 'pendente_producao': return [202, 138, 4]; // yellow
    default: return [128, 128, 128]; // gray
  }
};

export const gerarInstalacoesPDF = (data: InstalacoesPDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait orientation
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 10;
  let yPosition = 15;

  // Configuração de cores
  const primaryColor = [41, 128, 185] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];
  
  // Configurar fonte padrão
  pdf.setFont('helvetica', 'normal');

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

  // Título do documento
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO DE INSTALAÇÕES CADASTRADAS', margin, yPosition);
  
  // Data de geração
  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition + 8);
  
  yPosition += 20;

  // Preparar dados para a tabela
  const tableData = data.instalacoes.map(instalacao => {
    return [
      instalacao.nome_cliente,
      instalacao.telefone_cliente || '-',
      `${instalacao.cidade}, ${instalacao.estado}`,
      getCategoriaLabel(instalacao.categoria),
      getStatusLabel(instalacao.status),
      instalacao.tamanho || '-',
      instalacao.data_instalacao 
        ? format(parseISO(instalacao.data_instalacao), 'dd/MM/yyyy', { locale: ptBR })
        : '-',
      instalacao.responsavel_instalacao_nome || '-',
      format(parseISO(instalacao.created_at), 'dd/MM/yy', { locale: ptBR })
    ];
  });

  // Gerar tabela principal
  autoTable(pdf, {
    head: [['Cliente', 'Telefone', 'Localização', 'Categoria', 'Status', 'Tamanho', 'Data Inst.', 'Responsável', 'Cadastro']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 28 }, // Cliente
      1: { cellWidth: 22 }, // Telefone
      2: { cellWidth: 26 }, // Localização
      3: { cellWidth: 18 }, // Categoria
      4: { cellWidth: 24 }, // Status
      5: { cellWidth: 16 }, // Tamanho
      6: { cellWidth: 18 }, // Data Instalação
      7: { cellWidth: 22 }, // Responsável
      8: { cellWidth: 16 }, // Cadastro
    },
    margin: { left: margin, right: margin },
    theme: 'striped',
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Resumo estatístico
  const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 100;
  let resumoY = finalY + 15;

  // Verificar se há espaço na página atual
  if (resumoY + 60 > pageHeight - 20) {
    pdf.addPage();
    resumoY = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Resumo Estatístico:', margin, resumoY);
  resumoY += 8;

  // Calcular estatísticas
  const total = data.instalacoes.length;
  const porStatus = {
    finalizada: data.instalacoes.filter(i => i.status === 'finalizada').length,
    pronta_fabrica: data.instalacoes.filter(i => i.status === 'pronta_fabrica').length,
    pendente_producao: data.instalacoes.filter(i => i.status === 'pendente_producao').length,
  };
  const porCategoria = {
    instalacao: data.instalacoes.filter(i => i.categoria === 'instalacao').length,
    entrega: data.instalacoes.filter(i => i.categoria === 'entrega').length,
    correcao: data.instalacoes.filter(i => i.categoria === 'correcao').length,
  };
  
  // Contar por estado
  const estadosCount: Record<string, number> = {};
  data.instalacoes.forEach(i => {
    estadosCount[i.estado] = (estadosCount[i.estado] || 0) + 1;
  });
  const estadoMaisComum = Object.keys(estadosCount).length > 0
    ? Object.keys(estadosCount).reduce((a, b) => estadosCount[a] > estadosCount[b] ? a : b)
    : '-';

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`• Total de instalações cadastradas: ${total}`, margin, resumoY);
  resumoY += 6;
  
  pdf.text(`• Status:`, margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  pdf.text(`  - Finalizadas: ${porStatus.finalizada}`, margin + 5, resumoY);
  resumoY += 5;
  pdf.text(`  - Prontas na Fábrica: ${porStatus.pronta_fabrica}`, margin + 5, resumoY);
  resumoY += 5;
  pdf.text(`  - Pendentes Produção: ${porStatus.pendente_producao}`, margin + 5, resumoY);
  resumoY += 6;
  
  pdf.setFontSize(10);
  pdf.text(`• Categoria:`, margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  pdf.text(`  - Instalações: ${porCategoria.instalacao}`, margin + 5, resumoY);
  resumoY += 5;
  pdf.text(`  - Entregas: ${porCategoria.entrega}`, margin + 5, resumoY);
  resumoY += 5;
  pdf.text(`  - Correções: ${porCategoria.correcao}`, margin + 5, resumoY);
  resumoY += 6;
  
  pdf.setFontSize(10);
  pdf.text(`• Estado mais comum: ${estadoMaisComum} (${estadosCount[estadoMaisComum] || 0} instalações)`, margin, resumoY);

  // Rodapé
  const rodapeY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, rodapeY);
  pdf.text('Contato: comercial@elisaportas.com.br', margin, rodapeY + 5);

  return pdf;
};

export const baixarInstalacoesPDF = (data: InstalacoesPDFData) => {
  const doc = gerarInstalacoesPDF(data);
  const fileName = `relatorio-instalacoes-${format(new Date(), "dd-MM-yyyy")}.pdf`;
  doc.save(fileName);
};