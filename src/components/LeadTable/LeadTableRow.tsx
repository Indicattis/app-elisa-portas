
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Play, Tag, Trash2, X, CheckCircle } from "lucide-react";
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
  onMarkAsDisqualified?: (leadId: string) => void;
  onCancelAttendance?: (leadId: string) => void;
  onMarkAsSold?: (leadId: string) => void;
  hasApprovedBudget?: boolean;
}

export function LeadTableRow({
  lead,
  atendentes,
  canManage,
  onRowDoubleClick,
  onStartAttendance,
  onMarkAsLost,
  onMarkAsDisqualified,
  onCancelAttendance,
  onMarkAsSold,
  hasApprovedBudget = false,
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

  const handleMarkAsDisqualifiedClick = () => {
    if (onMarkAsDisqualified) {
      onMarkAsDisqualified(lead.id);
    }
  };

  const handleCancelAttendanceClick = () => {
    if (onCancelAttendance) {
      onCancelAttendance(lead.id);
    }
  };

  const handleMarkAsSoldClick = () => {
    if (onMarkAsSold) {
      onMarkAsSold(lead.id);
    }
  };

  // Lead vendido não pode ser alterado
  const isReadOnly = lead.status_atendimento === 5;

  return (
    <TableRow 
      key={lead.id} 
      className={`cursor-pointer ${statusInfo.rowClassName}`}
      onDoubleClick={() => !isReadOnly && onRowDoubleClick(lead.id)}
    >
      {/* Etiqueta como ícone de tag - primeira coluna */}
      <TableCell>
        {tagObject ? (
          <div className="flex items-center" title={tagObject.name}>
            <Tag 
              className="w-4 h-4" 
              style={{ color: tagObject.bgColor }}
            />
          </div>
        ) : (
          <Tag className="w-4 h-4 text-gray-300" />
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
        {lead.atendente_id ? (
          <Badge variant="default" className="bg-primary text-primary-foreground font-medium px-3 py-1">
            {atendentes.get(lead.atendente_id) || "-"}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
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
            disabled={isReadOnly}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          
          {/* Botão Capturar - apenas para leads aguardando atendente */}
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

          {/* Botões para leads em andamento (capturados) */}
          {canManage && lead.status_atendimento === 2 && (
            <>
              {/* Botão Vendido - apenas se tiver orçamento aprovado */}
              {hasApprovedBudget && onMarkAsSold && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsSoldClick();
                  }}
                  title="Marcar como vendido"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}

              {/* Botão Desqualificar */}
              {onMarkAsDisqualified && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-500 text-gray-600 hover:bg-gray-50 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsDisqualifiedClick();
                  }}
                  title="Desqualificar lead"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              {/* Botão Cancelar */}
              {onCancelAttendance && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-600 hover:bg-red-50 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelAttendanceClick();
                  }}
                  title="Cancelar atendimento"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          {/* Botão Marcar como perdido - apenas para leads aguardando aprovação */}
          {canManage && lead.status_atendimento === 4 && onMarkAsLost && (
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
