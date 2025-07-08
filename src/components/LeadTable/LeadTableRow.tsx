
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Play, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/types/lead";
import { getLeadStatus, statusConfig } from "@/utils/leadStatus";
import { getTempoAtendimento, handleWhatsAppClick } from "@/utils/timeUtils";

interface LeadTableRowProps {
  lead: Lead;
  atendentes: Map<string, string>;
  canManage: boolean;
  onRowDoubleClick: (leadId: string) => void;
  onStartAttendance: (leadId: string) => void;
  onNavigateToSale: (leadId: string) => void;
}

export function LeadTableRow({
  lead,
  atendentes,
  canManage,
  onRowDoubleClick,
  onStartAttendance,
}: LeadTableRowProps) {
  const status = getLeadStatus(lead);
  const statusInfo = statusConfig[status as keyof typeof statusConfig];

  return (
    <TableRow 
      key={lead.id} 
      className="cursor-pointer hover:bg-muted/50"
      onDoubleClick={() => onRowDoubleClick(lead.id)}
    >
      <TableCell>
        <div 
          className={`w-3 h-3 rounded-full ${statusInfo.className}`}
          title={statusInfo.label}
        />
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
        {lead.status_atendimento === 2 && lead.data_inicio_atendimento
          ? getTempoAtendimento(lead.data_inicio_atendimento)
          : "-"}
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
        <div className="flex justify-end space-x-2">
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
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onStartAttendance(lead.id);
              }}
              title="Iniciar atendimento"
            >
              <Play className="w-4 h-4 mr-1" />
              Iniciar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
