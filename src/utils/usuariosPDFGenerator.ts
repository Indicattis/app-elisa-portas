import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UsuarioPDF {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  role: string;
  setor: string | null;
  ativo: boolean;
  codigo_usuario: string | null;
  created_at: string;
}

interface UsuariosPDFData {
  usuarios: UsuarioPDF[];
  roleLabelsMap: Record<string, string>;
}

const getSetorLabel = (setor: string | null): string => {
  switch (setor) {
    case 'vendas': return 'Vendas';
    case 'marketing': return 'Marketing';
    case 'instalacoes': return 'Instalações';
    case 'fabrica': return 'Fábrica';
    case 'administrativo': return 'Administrativo';
    default: return '-';
  }
};

export const gerarUsuariosPDF = (data: UsuariosPDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
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
  pdf.text('RELATÓRIO DE USUÁRIOS DO SISTEMA', margin, yPosition);
  
  // Data de geração
  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition + 8);
  
  yPosition += 20;

  // Preparar dados para a tabela
  const tableData = data.usuarios.map(usuario => {
    const initials = usuario.nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return [
      initials,
      usuario.nome,
      usuario.email,
      usuario.cpf || '-',
      data.roleLabelsMap[usuario.role] || usuario.role,
      getSetorLabel(usuario.setor),
      usuario.codigo_usuario || '-',
      usuario.ativo ? 'Ativo' : 'Inativo',
      format(parseISO(usuario.created_at), 'dd/MM/yyyy', { locale: ptBR })
    ];
  });

  // Gerar tabela principal
  autoTable(pdf, {
    head: [['', 'Nome', 'Email', 'CPF', 'Função', 'Setor', 'Código', 'Status', 'Cadastro']],
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
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // Iniciais
      1: { cellWidth: 28 }, // Nome
      2: { cellWidth: 38 }, // Email
      3: { cellWidth: 24, halign: 'center' }, // CPF
      4: { cellWidth: 24 }, // Função
      5: { cellWidth: 18 }, // Setor
      6: { cellWidth: 15, halign: 'center' }, // Código
      7: { cellWidth: 14, halign: 'center' }, // Status
      8: { cellWidth: 17, halign: 'center' }, // Data Cadastro
    },
    margin: { left: margin, right: margin },
    theme: 'striped',
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didParseCell: function(data) {
      // Colorir status (agora na coluna 7)
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'Ativo') {
          data.cell.styles.textColor = [22, 163, 74]; // green
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38]; // red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Resumo estatístico
  const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 100;
  let resumoY = finalY + 15;

  // Verificar se há espaço na página atual
  if (resumoY + 80 > pageHeight - 20) {
    pdf.addPage();
    resumoY = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Resumo Estatístico:', margin, resumoY);
  resumoY += 8;

  // Calcular estatísticas
  const total = data.usuarios.length;
  const ativos = data.usuarios.filter(u => u.ativo).length;
  const inativos = total - ativos;
  
  // Por setor
  const setorCount: Record<string, number> = {};
  data.usuarios.forEach(u => {
    const setor = u.setor || 'sem_setor';
    setorCount[setor] = (setorCount[setor] || 0) + 1;
  });
  
  // Por função
  const funcaoCount: Record<string, number> = {};
  data.usuarios.forEach(u => {
    funcaoCount[u.role] = (funcaoCount[u.role] || 0) + 1;
  });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`• Total de usuários: ${total}`, margin, resumoY);
  resumoY += 6;
  pdf.text(`• Usuários ativos: ${ativos}`, margin, resumoY);
  resumoY += 6;
  pdf.text(`• Usuários inativos: ${inativos}`, margin, resumoY);
  resumoY += 8;
  
  pdf.text(`• Distribuição por setor:`, margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  Object.entries(setorCount).forEach(([setor, count]) => {
    const label = setor === 'sem_setor' ? 'Sem setor' : getSetorLabel(setor);
    pdf.text(`  - ${label}: ${count}`, margin + 5, resumoY);
    resumoY += 5;
  });
  resumoY += 3;
  
  pdf.setFontSize(10);
  pdf.text(`• Distribuição por função:`, margin, resumoY);
  resumoY += 5;
  pdf.setFontSize(9);
  
  // Ordenar por quantidade (maior para menor)
  const funcaoOrdenada = Object.entries(funcaoCount).sort((a, b) => b[1] - a[1]);
  funcaoOrdenada.forEach(([role, count]) => {
    const label = data.roleLabelsMap[role] || role;
    pdf.text(`  - ${label}: ${count}`, margin + 5, resumoY);
    resumoY += 5;
  });

  // Rodapé
  const rodapeY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text('Elisa Portas LTDA - A maior fábrica de portas de enrolar do Sul do País', margin, rodapeY);
  pdf.text('Contato: comercial@elisaportas.com.br', margin, rodapeY + 5);

  return pdf;
};

export const baixarUsuariosPDF = (data: UsuariosPDFData) => {
  const doc = gerarUsuariosPDF(data);
  const fileName = `relatorio-usuarios-${format(new Date(), "dd-MM-yyyy")}.pdf`;
  doc.save(fileName);
};
