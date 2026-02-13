import jsPDF from "jspdf";
import { format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";

export interface CronogramaMinimalistaPDFData {
  ordens: OrdemCarregamento[];
  neoInstalacoes: NeoInstalacao[];
  neoCorrecoes: NeoCorrecao[];
  periodoInicio: Date;
  periodoFim: Date;
  equipeNome: string;
  tipoVisualizacao: 'week' | 'month';
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [200, 200, 200];
};

export const baixarCronogramaMinimalistaPDF = (data: CronogramaMinimalistaPDFData): void => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CRONOGRAMA DE INSTALAÇÕES", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const periodoTexto = data.tipoVisualizacao === 'week'
    ? `Semana: ${format(data.periodoInicio, "dd/MM/yyyy")} a ${format(data.periodoFim, "dd/MM/yyyy")}`
    : `Mês: ${format(data.periodoInicio, "MMMM 'de' yyyy", { locale: ptBR })}`;
  doc.text(periodoTexto, pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(10);
  doc.text(`Equipe: ${data.equipeNome}`, pageWidth / 2, y, { align: "center" });

  y += 10;

  const dias = eachDayOfInterval({ start: data.periodoInicio, end: data.periodoFim });

  dias.forEach((dia) => {
    const ordensNoDia = data.ordens.filter(o => o.data_carregamento && isSameDay(parseISO(o.data_carregamento), dia));
    const neosNoDia = data.neoInstalacoes.filter(n => n.data_instalacao && isSameDay(parseISO(n.data_instalacao), dia));
    const correcoesNoDia = data.neoCorrecoes.filter(c => c.data_correcao && isSameDay(parseISO(c.data_correcao), dia));

    const total = ordensNoDia.length + neosNoDia.length + correcoesNoDia.length;

    if (y > pageHeight - 50) { doc.addPage(); y = 20; }

    // Day header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR }), 15, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 1, pageWidth - 15, y + 1);
    y += 6;

    if (total === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("  [sem agendamentos]", 20, y);
      y += 8;
      return;
    }

    // Instalações (ordens)
    ordensNoDia.forEach((o) => {
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }
      // Blue marker
      doc.setFillColor(59, 130, 246);
      doc.rect(18, y - 3, 2, 4, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${o.hora || '--:--'} - Instalação`, 22, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${o.nome_cliente}`, 22, y);
      y += 4;
      const cidade = o.venda?.cidade || '';
      const estado = o.venda?.estado || '';
      if (cidade || estado) {
        doc.text(`Local: ${cidade}${estado ? ' - ' + estado : ''}`, 22, y);
        y += 4;
      }
      y += 3;
    });

    // Neo Instalações
    neosNoDia.forEach((n) => {
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }
      // Orange marker
      doc.setFillColor(249, 115, 22);
      doc.rect(18, y - 3, 2, 4, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${n.hora || '--:--'} - Neo Instalação`, 22, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${n.nome_cliente}`, 22, y);
      y += 4;
      doc.text(`Local: ${n.cidade} - ${n.estado}`, 22, y);
      y += 4;
      if (n.equipe?.nome) {
        doc.text(`Equipe: ${n.equipe.nome}`, 22, y);
        y += 4;
      }
      y += 3;
    });

    // Neo Correções
    correcoesNoDia.forEach((c) => {
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }
      // Purple marker
      doc.setFillColor(139, 92, 246);
      doc.rect(18, y - 3, 2, 4, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${c.hora || '--:--'} - Neo Correção`, 22, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${c.nome_cliente}`, 22, y);
      y += 4;
      doc.text(`Local: ${c.cidade} - ${c.estado}`, 22, y);
      y += 4;
      if (c.equipe?.nome) {
        doc.text(`Equipe: ${c.equipe.nome}`, 22, y);
        y += 4;
      }
      y += 3;
    });

    y += 2;
  });

  // Resumo
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo:", 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Instalações: ${data.ordens.length}`, 15, y);
  y += 5;
  doc.text(`Neo Instalações: ${data.neoInstalacoes.length}`, 15, y);
  y += 5;
  doc.text(`Neo Correções: ${data.neoCorrecoes.length}`, 15, y);
  y += 5;
  doc.text(`Total: ${data.ordens.length + data.neoInstalacoes.length + data.neoCorrecoes.length}`, 15, y);

  // Footer
  const rodapeY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2, rodapeY, { align: "center" }
  );

  const nomeArquivo = `cronograma-instalacoes-${format(data.periodoInicio, "dd-MM-yyyy")}.pdf`;
  doc.save(nomeArquivo);
};
