import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MaterialConsolidado } from "@/hooks/useMateriaisPendentesPorEtapa";

interface RelatorioPDFData {
  materiais: MaterialConsolidado[];
  totalPedidos: number;
  etapas: string[];
}

export function gerarRelatorioMateriaisPDF(data: RelatorioPDFData): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE MATERIAIS PENDENTES", 148, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    148,
    27,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.text(`Pedidos considerados: ${data.totalPedidos}`, 14, 36);
  doc.text(`Etapas: ${data.etapas.join(", ") || "—"}`, 14, 41);

  const rows = data.materiais.map((m) => [
    m.nome_produto,
    m.descricao_produto || "—",
    m.unidade || "un",
    m.quantidade_total.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
    m.metragem_total.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
    m.estoque_atual.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
    m.faltante.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
  ]);

  autoTable(doc, {
    head: [["Material", "Descrição", "Unid.", "Qtd. Total", "Metragem Total", "Estoque", "Faltante"]],
    body: rows,
    startY: 46,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] },
    },
  });

  return doc;
}