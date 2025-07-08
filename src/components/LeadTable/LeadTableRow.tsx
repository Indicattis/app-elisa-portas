
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Play, Flag, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/types/lead";
import { getLeadStatus, statusConfig } from "@/utils/leadStatus";
import { handleWhatsAppClick } from "@/utils/timeUtils";
import { getLeadTag } from "@/utils/leadTags";

interface LeadTableRowProps {
  lead: Lead;
  atendentes: Map<string, string>;
  canManage: boolean;
  onRowDoubleClick: (leadId: string) => void;
  onStartAttendance: (leadId: string) => void;
  onNavigateToSale: (leadId: string) => void;
  onMarkAsLost?: (leadId: string) => void;
}

export function LeadTableRow({
  lead,
  atendentes,
  canManage,
  onRowDoubleClick,
  onStartAttendance,
  onMarkAsLost,
}: LeadTableRowProps) {
  const status = getLeadStatus(lead);
  const statusInfo = statusConfig[status as keyof typeof statusConfig];

  // Extrair etiqueta das observações (apenas uma)
  let leadTag: string | null = null;
  try {
    if (lead.observacoes) {
      const parsed = JSON.parse(lead.observacoes);
      leadTag = parsed.tags?.[0] || null;
    }
  } catch {
    // Se não conseguir fazer parse, não há tags
  }

  const tagObject = leadTag ? getLeadTag([leadTag]) : null;

  const handleMarkAsLostClick = () => {
    if (onMarkAsLost) {
      onMarkAsLost(lead.id);
    }
  };

  return (
    <TableRow 
      key={lead.id} 
      className={`cursor-pointer ${statusInfo.rowClassName}`}
      onDoubleClick={() => onRowDoubleClick(lead.id)}
    >
      {/* Etiqueta como flag - primeira coluna */}
      <TableCell>
        {tagObject ? (
          <div className="flex items-center">
            <Flag 
              className="w-4 h-4" 
              style={{ color: tagObject.bgColor }}
              title={tagObject.name}
            />
          </div>
        ) : (
          <Flag className="w-4 h-4 text-gray-300" />
        )}
      </TableCell>
      
      <TableCell className="font-medium">{lead.nome}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">{lead.email}</div>
          <div className="text-sm text-muted-foreground">{lead.telefone}</div>
        </div>
      </TableCell>
      <TableCell>{lead.cidade}</TableCell>
      <TableCell>
        <Badge variant="outline">{lead.canal_aquisicao}</Badge>
      </TableCell>
      <TableCell>
        {lead.atendente_id ? atendentes.get(lead.atendente_id) || "-" : "-"}
      </TableCell>
      <TableCell>
        {format(new Date(lead.data_envio), "dd/MM/yyyy", { locale: ptBR })}
      </TableCell>
      <TableCell>
        {lead.valor_orcamento
          ? `R$ ${lead.valor_orcamento.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`
          : "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsAppClick(lead.telefone, lead.nome);
            }}
            title="Iniciar conversa no WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          
          {canManage && lead.status_atendimento === 1 && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onStartAttendance(lead.id);
              }}
              title="Capturar lead"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}

          {canManage && lead.status_atendimento === 2 && onMarkAsLost && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-50 px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsLostClick();
              }}
              title="Marcar como perdido"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
