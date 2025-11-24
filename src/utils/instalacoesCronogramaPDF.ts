import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Instalacao, EquipeInstalacao } from "@/types/instalacao";

export interface CronogramaInstalacoesPDFData {
  instalacoes: Instalacao[];
  equipes: EquipeInstalacao[];
  periodoInicio: Date;
  periodoFim: Date;
  equipeSelecionada: EquipeInstalacao | null;
  tipoVisualizacao: 'semanal' | 'mensal';
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [200, 200, 200];
};

export const gerarCronogramaInstalacoesPDF = (data: CronogramaInstalacoesPDFData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Logo e cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CRONOGRAMA DE INSTALAÇÕES", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const periodoTexto = data.tipoVisualizacao === 'semanal'
    ? `Semana: ${format(data.periodoInicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(data.periodoFim, "dd/MM/yyyy", { locale: ptBR })}`
    : `Mês: ${format(data.periodoInicio, "MMMM 'de' yyyy", { locale: ptBR })}`;
  
  doc.text(periodoTexto, pageWidth / 2, yPosition, { align: "center" });

  if (data.equipeSelecionada) {
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Equipe: ${data.equipeSelecionada.nome}`, pageWidth / 2, yPosition, { align: "center" });
  }

  yPosition += 10;

  // Preparar dados - dias do período
  const periodoDias = eachDayOfInterval({
    start: data.periodoInicio,
    end: data.periodoFim,
  });

  // Iterar por cada dia e listar instalações
  periodoDias.forEach((dia) => {
    // Verificar quebra de página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Título do dia
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(
      format(dia, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      15,
      yPosition
    );

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPosition + 1, pageWidth - 15, yPosition + 1);
    yPosition += 6;

    // Buscar instalações do dia
    const instalacoesNoDia = data.instalacoes.filter((inst) =>
      isSameDay(new Date(inst.data), dia)
    );

    // Filtrar por equipe se selecionada
    const instalacoesExibir = data.equipeSelecionada
      ? instalacoesNoDia.filter((inst) => inst.equipe_id === data.equipeSelecionada!.id)
      : instalacoesNoDia;

    if (instalacoesExibir.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("  [sem instalações]", 20, yPosition);
      yPosition += 8;
    } else {
      // Listar cada instalação
      instalacoesExibir.forEach((inst, index) => {
        // Verificar quebra de página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Encontrar equipe
        const equipe = data.equipes.find((e) => e.id === inst.equipe_id);

        // Cor da equipe (retângulo pequeno)
        if (equipe?.cor) {
          const rgb = hexToRgb(equipe.cor);
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(18, yPosition - 3, 2, 4, "F");
        }

        // Hora e equipe
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${inst.hora} - ${equipe?.nome || "Sem equipe"}`, 22, yPosition);

        // Cliente
        yPosition += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`Cliente: ${inst.nome_cliente}`, 22, yPosition);

        // Cidade/Estado
        yPosition += 5;
        const cidade = inst.venda?.cidade || 'Sem cidade';
        const estado = inst.venda?.estado || '';
        doc.text(`Local: ${cidade}${estado ? ' - ' + estado : ''}`, 22, yPosition);

        // Linha separadora entre instalações
        yPosition += 4;
        doc.setDrawColor(220, 220, 220);
        doc.line(22, yPosition, pageWidth - 20, yPosition);
        yPosition += 6;
      });
    }

    // Espaço extra entre dias
    yPosition += 3;
  });

  // Posição para resumo
  let resumoY = yPosition + 5;

  // Adicionar nova página para resumo se necessário
  if (resumoY > pageHeight - 40) {
    doc.addPage();
    resumoY = 20;
  }

  // Resumo estatístico
  const totalInstalacoes = data.instalacoes.length;
  const equipesAtivas = data.equipes.filter((e) => e.ativa).length;

  const instalacooesPorDia = periodoDias.map((dia) => ({
    dia,
    quantidade: data.instalacoes.filter((inst) => isSameDay(new Date(inst.data), dia)).length,
  }));

  const diaMovimentado = instalacooesPorDia.reduce(
    (max, item) => (item.quantidade > max.quantidade ? item : max),
    { dia: periodoDias[0], quantidade: 0 }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo:", 15, resumoY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de instalações: ${totalInstalacoes}`, 15, resumoY + 6);
  doc.text(`Equipes ativas: ${equipesAtivas}`, 15, resumoY + 12);
  doc.text(
    `Dia mais movimentado: ${format(diaMovimentado.dia, "dd/MM/yyyy", { locale: ptBR })} (${diaMovimentado.quantidade} instalações)`,
    15,
    resumoY + 18
  );

  // Rodapé com informações da empresa
  const rodapeY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    rodapeY,
    { align: "center" }
  );

  return doc;
};

export const baixarCronogramaInstalacoesPDF = (data: CronogramaInstalacoesPDFData): void => {
  const pdf = gerarCronogramaInstalacoesPDF(data);
  
  const nomeEquipe = data.equipeSelecionada 
    ? `-${data.equipeSelecionada.nome.toLowerCase().replace(/\s+/g, "-")}`
    : "";
  
  const nomeArquivo = data.tipoVisualizacao === 'semanal'
    ? `cronograma-instalacoes-semanal${nomeEquipe}-${format(data.periodoInicio, "dd-MM-yyyy")}.pdf`
    : `cronograma-instalacoes-mensal${nomeEquipe}-${format(data.periodoInicio, "MM-yyyy")}.pdf`;

  pdf.save(nomeArquivo);
};
