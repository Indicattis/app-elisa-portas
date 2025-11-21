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
    orientation: "landscape",
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

  // Preparar dados da tabela
  const diasPeriodo = eachDayOfInterval({
    start: data.periodoInicio,
    end: data.periodoFim,
  });

  const equipesParaMostrar = data.equipeSelecionada
    ? [data.equipeSelecionada]
    : data.equipes.filter(e => e.ativa);

  // Cabeçalho da tabela
  const headerRow = [
    "Equipe",
    ...diasPeriodo.map(dia => 
      format(dia, data.tipoVisualizacao === 'semanal' ? "EEE\ndd/MM" : "dd", { locale: ptBR })
    ),
  ];

  // Linhas de dados
  const bodyRows = equipesParaMostrar.map(equipe => {
    const row = [equipe.nome];
    
    diasPeriodo.forEach(dia => {
      const instalacoesNoDia = data.instalacoes.filter(
        inst => inst.equipe_id === equipe.id && isSameDay(new Date(inst.data), dia)
      );

      if (instalacoesNoDia.length === 0) {
        row.push("-");
      } else {
        const texto = instalacoesNoDia
          .map(inst => `${inst.nome_cliente}\n${inst.cidade}\n${inst.produto}`)
          .join("\n\n");
        row.push(texto);
      }
    });

    return row;
  });

  // Gerar tabela
  autoTable(doc, {
    head: [headerRow],
    body: bodyRows,
    startY: yPosition,
    theme: "grid",
    styles: {
      fontSize: data.tipoVisualizacao === 'mensal' ? 7 : 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: {
        cellWidth: 30,
        fontStyle: "bold",
        fillColor: [245, 245, 245],
      },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index > 0) {
        const equipeIndex = data.row.index;
        const equipe = equipesParaMostrar[equipeIndex];
        
        if (equipe?.cor && data.cell.text.join("") !== "-") {
          const rgb = hexToRgb(equipe.cor);
          data.cell.styles.fillColor = [rgb[0], rgb[1], rgb[2], 0.15] as any;
        }
      }
    },
    margin: { left: 10, right: 10 },
  });

  // Calcular posição após tabela
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Legenda de cores das equipes
  if (!data.equipeSelecionada && equipesParaMostrar.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Legenda de Equipes:", 15, finalY);

    let legendaX = 15;
    let legendaY = finalY + 5;

    equipesParaMostrar.forEach((equipe, index) => {
      if (equipe.cor) {
        const rgb = hexToRgb(equipe.cor);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(legendaX, legendaY - 3, 4, 4, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.text(equipe.nome, legendaX + 6, legendaY);

      legendaX += 50;
      if ((index + 1) % 5 === 0) {
        legendaX = 15;
        legendaY += 6;
      }
    });
  }

  // Resumo estatístico
  const totalInstalacoes = data.instalacoes.length;
  const equipesAtivas = equipesParaMostrar.length;
  
  const instalacooesPorDia = diasPeriodo.map(dia => ({
    dia,
    quantidade: data.instalacoes.filter(inst => isSameDay(new Date(inst.data), dia)).length,
  }));
  
  const diaMovimentado = instalacooesPorDia.reduce((max, item) => 
    item.quantidade > max.quantidade ? item : max
  , { dia: diasPeriodo[0], quantidade: 0 });

  const resumoY = pageHeight - 25;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo:", 15, resumoY);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Total de instalações: ${totalInstalacoes}`, 15, resumoY + 5);
  doc.text(`Equipes ativas: ${equipesAtivas}`, 15, resumoY + 10);
  doc.text(
    `Dia mais movimentado: ${format(diaMovimentado.dia, "dd/MM/yyyy", { locale: ptBR })} (${diaMovimentado.quantidade} instalações)`,
    15,
    resumoY + 15
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
