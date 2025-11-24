import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InstalacaoCronograma } from '@/hooks/useInstalacoesCronograma';

interface EquipeInstalacao {
  id: string;
  nome: string;
  cor: string;
  ativa: boolean;
}

interface CronogramaPDFData {
  equipes: EquipeInstalacao[];
  instalacoes: InstalacaoCronograma[];
  weekStart: Date;
}

const DIAS_SEMANA = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

const getCategoriaLabel = (categoria: string) => {
  switch (categoria) {
    case 'instalacao': return 'Instalação';
    case 'entrega': return 'Entrega';
    case 'correcao': return 'Correção';
    case 'carregamento_agendado': return 'Carregamento';
    default: return categoria;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pendente_producao': return 'Pendente';
    case 'pronta_fabrica': return 'Pronta';
    case 'finalizada': return 'Finalizada';
    default: return status;
  }
};

export const gerarCronogramaPDF = (data: CronogramaPDFData) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
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
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CRONOGRAMA DE INSTALAÇÕES', margin, yPosition);
  
  // Período do cronograma
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const weekEnd = addDays(data.weekStart, 6);
  const periodoTexto = `Período: ${format(data.weekStart, "dd 'de' MMMM", { locale: ptBR })} a ${format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  pdf.text(periodoTexto, margin, yPosition + 10);
  
  // Data de geração
  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - margin - 80, yPosition + 10);
  
  yPosition += 25;

  // Preparar dados para a tabela
  const tableHeaders = ['Equipe', ...DIAS_SEMANA.map(dia => {
    const dataAtual = addDays(data.weekStart, DIAS_SEMANA.indexOf(dia));
    return `${dia.label}\n${format(dataAtual, "dd/MM", { locale: ptBR })}`;
  })];

  const tableData = data.equipes.map(equipe => {
    const row = [equipe.nome];
    
    DIAS_SEMANA.forEach(dia => {
      const instalacoesNoDia = data.instalacoes.filter(
        i => i.responsavel_instalacao_id === equipe.id && i.dia_semana === dia.value
      );
      
      if (instalacoesNoDia.length === 0) {
        row.push('-');
      } else {
        const instalacoesTexto = instalacoesNoDia.map(instalacao => {
          const cidade = instalacao.venda?.cidade || 'Sem cidade';
          let texto = `${instalacao.nome_cliente}\n${cidade}`;
          texto += ` - ${getStatusLabel(instalacao.status)}`;
          return texto;
        }).join('\n\n');
        row.push(instalacoesTexto);
      }
    });
    
    return row;
  });

  // Gerar tabela principal
  autoTable(pdf, {
    head: [tableHeaders],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'top',
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { 
        cellWidth: 28,
        fontStyle: 'bold',
        fillColor: [245, 245, 245],
        halign: 'left'
      },
      1: { cellWidth: 33 },
      2: { cellWidth: 33 },
      3: { cellWidth: 33 },
      4: { cellWidth: 33 },
      5: { cellWidth: 33 },
      6: { cellWidth: 33 },
      7: { cellWidth: 33 },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
    tableWidth: 'wrap'
  });

  // Adicionar legenda das equipes com cores
  const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 100;
  let legendaY = finalY + 15;

  // Verificar se há espaço na página atual
  if (legendaY + (data.equipes.length * 8) + 50 > pageHeight - 20) {
    pdf.addPage();
    legendaY = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Legenda das Equipes:', margin, legendaY);
  legendaY += 10;

  data.equipes.forEach((equipe) => {
    // Quadrado colorido
    pdf.setFillColor(equipe.cor);
    pdf.rect(margin, legendaY - 3, 4, 4, 'F');
    
    // Nome da equipe
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(equipe.nome, margin + 8, legendaY);
    
    legendaY += 8;
  });

  // Resumo estatístico
  legendaY += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumo:', margin, legendaY);
  legendaY += 8;

  const totalInstalacoes = data.instalacoes.length;
  const equipesAtivas = data.equipes.length;
  const instalacoesPorDia = DIAS_SEMANA.map(dia => 
    data.instalacoes.filter(i => i.dia_semana === dia.value).length
  );
  const diaMaisMovimentado = DIAS_SEMANA[instalacoesPorDia.indexOf(Math.max(...instalacoesPorDia))];

  // Estatísticas por categoria removidas - coluna não existe mais

  pdf.text(`• Total de instalações agendadas: ${totalInstalacoes}`, margin, legendaY);
  pdf.text(`• Equipes ativas: ${equipesAtivas}`, margin, legendaY + 6);
  pdf.text(`• Dia mais movimentado: ${diaMaisMovimentado?.label || 'N/A'} (${Math.max(...instalacoesPorDia)} instalações)`, margin, legendaY + 12);

  // Rodapé
  const rodapeY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, rodapeY);
  pdf.text('Contato: comercial@elisaportas.com.br', margin, rodapeY + 5);

  return pdf;
};

export const baixarCronogramaPDF = (data: CronogramaPDFData) => {
  const doc = gerarCronogramaPDF(data);
  const fileName = `cronograma-instalacao-${format(data.weekStart, "dd-MM-yyyy")}.pdf`;
  doc.save(fileName);
};
